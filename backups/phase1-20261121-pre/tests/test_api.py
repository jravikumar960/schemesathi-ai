from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import create_app
from app.models.scheme import Scheme
from app.services.seed import load_scheme_file
from app.main import DATA_FILE

import app.models  # Register ORM models


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)

    scheme_file = load_scheme_file(DATA_FILE)

    with Session() as db:
        for seed in scheme_file.schemes:
            payload = seed.model_dump()
            payload["eligibility_conditions"] = [
                condition.model_dump(mode="json")
                for condition in seed.eligibility_conditions
            ]
            db.add(Scheme(**payload))
        db.commit()

    def override_get_db():
        with Session() as db:
            yield db

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    app = create_app()
    app.router.lifespan_context = test_lifespan
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_schemes(client):
    response = client.get("/api/schemes")
    assert response.status_code == 200
    assert len(response.json()) >= 5


def test_get_scheme(client):
    schemes = client.get("/api/schemes").json()
    slug = schemes[0]["slug"]

    response = client.get(f"/api/schemes/{slug}")
    assert response.status_code == 200
    assert response.json()["slug"] == slug


def test_unknown_scheme(client):
    response = client.get("/api/schemes/does-not-exist")
    assert response.status_code == 404


def test_application_lifecycle(client):
    slug = client.get("/api/schemes").json()[0]["slug"]

    payload = {
        "session_key": "pytest-session",
        "scheme_slug": slug,
    }

    created = client.post("/api/applications", json=payload)
    assert created.status_code == 201, created.text

    application_id = created.json()["id"]

    listed = client.get(
        "/api/applications",
        params={"session_key": "pytest-session"},
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.patch(
        f"/api/applications/{application_id}",
        params={"session_key": "pytest-session"},
        json={"status": "IN_PROGRESS"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "IN_PROGRESS"


def test_duplicate_application_rejected(client):
    slug = client.get("/api/schemes").json()[0]["slug"]
    payload = {
        "session_key": "duplicate-session",
        "scheme_slug": slug,
    }

    first = client.post("/api/applications", json=payload)
    second = client.post("/api/applications", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409


def test_aadhaar_field_rejected(client):
    slug = client.get("/api/schemes").json()[0]["slug"]

    response = client.post(
        "/api/applications",
        json={
            "session_key": "privacy-test",
            "scheme_slug": slug,
            "aadhaar_number": "000000000000",
        },
    )
    assert response.status_code == 422


def test_missing_session_key_rejected(client):
    response = client.get("/api/applications")
    assert response.status_code == 422



def test_application_update_requires_matching_session(client):
    slug = client.get("/api/schemes").json()[0]["slug"]

    created = client.post(
        "/api/applications",
        json={
            "session_key": "owner-session",
            "scheme_slug": slug,
        },
    )

    assert created.status_code == 201
    application_id = created.json()["id"]

    unauthorized = client.patch(
        f"/api/applications/{application_id}",
        params={"session_key": "different-session"},
        json={"status": "COMPLETED"},
    )

    assert unauthorized.status_code == 404

    missing_key = client.patch(
        f"/api/applications/{application_id}",
        json={"status": "COMPLETED"},
    )

    assert missing_key.status_code == 422

    owner_check = client.get(
        "/api/applications",
        params={"session_key": "owner-session"},
    )

    assert owner_check.status_code == 200
    assert owner_check.json()[0]["status"] == "NOT_STARTED"

    authorized = client.patch(
        f"/api/applications/{application_id}",
        params={"session_key": "owner-session"},
        json={"status": "IN_PROGRESS"},
    )

    assert authorized.status_code == 200
    assert authorized.json()["status"] == "IN_PROGRESS"
