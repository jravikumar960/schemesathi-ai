"""Authenticated application ownership and CSRF regression tests."""

from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.database import Base, get_db
from app.main import create_app, DATA_FILE
from app.models.scheme import Scheme
from app.services.seed import load_scheme_file


PASSWORD = "StrongPassword123!"


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    scheme_file = load_scheme_file(DATA_FILE)

    with factory() as db:
        for seed in scheme_file.schemes:
            payload = seed.model_dump()
            payload["eligibility_conditions"] = [
                condition.model_dump(mode="json")
                for condition in seed.eligibility_conditions
            ]
            db.add(Scheme(**payload))
        db.commit()

    def override_get_db():
        with factory() as db:
            yield db

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    app = create_app()
    app.router.lifespan_context = test_lifespan
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, base_url="https://localhost") as test_client:
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()


def login(client, email):
    registration = client.post(
        "/api/auth/register",
        json={"email": email, "password": PASSWORD},
    )
    assert registration.status_code == 201, registration.text

    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text

    token = client.cookies.get("schemesathi_csrf")
    assert token
    return {"X-CSRF-Token": token}


def login_existing(client, email):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text

    token = client.cookies.get("schemesathi_csrf")
    assert token
    return {"X-CSRF-Token": token}


def create_application(client, headers):
    slug = client.get("/api/schemes").json()[0]["slug"]
    response = client.post(
        "/api/applications",
        json={"scheme_slug": slug},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_owner_can_update_status(client):
    headers = login(client, "owner1@example.com")
    app_id = create_application(client, headers)

    response = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "IN_PROGRESS"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_other_session_cannot_update_status(client):
    owner = "owner2@example.com"
    owner_headers = login(client, owner)
    app_id = create_application(client, owner_headers)

    attacker_headers = login(client, "attacker2@example.com")

    response = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "COMPLETED"},
        headers=attacker_headers,
    )
    assert response.status_code == 404

    login_existing(client, owner)
    records = client.get("/api/applications").json()

    assert len(records) == 1
    assert records[0]["status"] == "NOT_STARTED"


def test_other_session_cannot_see_record(client):
    owner_headers = login(client, "owner3@example.com")
    app_id = create_application(client, owner_headers)

    login(client, "attacker3@example.com")
    response = client.get("/api/applications")

    assert response.status_code == 200
    assert app_id not in [row["id"] for row in response.json()]


def test_missing_session_key_rejected_on_patch(client):
    owner = "owner4@example.com"
    headers = login(client, owner)
    app_id = create_application(client, headers)

    # Authentication alone is insufficient for writes.
    response = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "COMPLETED"},
    )
    assert response.status_code == 403

    records = client.get("/api/applications").json()
    assert records[0]["status"] == "NOT_STARTED"


def test_owner_record_not_deleted_by_other_session_attempt(client):
    owner = "owner5@example.com"
    headers = login(client, owner)
    app_id = create_application(client, headers)

    attacker_headers = login(client, "attacker5@example.com")
    attack = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "COMPLETED"},
        headers=attacker_headers,
    )
    assert attack.status_code == 404

    login_existing(client, owner)
    records = client.get("/api/applications").json()
    assert app_id in [row["id"] for row in records]


def test_two_users_can_track_same_scheme(client):
    first_headers = login(client, "first@example.com")
    first_id = create_application(client, first_headers)

    second_headers = login(client, "second@example.com")
    second_id = create_application(client, second_headers)

    assert first_id != second_id
    assert len(client.get("/api/applications").json()) == 1


def test_anonymous_access_rejected(client):
    assert client.get("/api/applications").status_code == 401

    response = client.post(
        "/api/applications",
        json={"scheme_slug": "test"},
    )
    assert response.status_code == 401


def test_legacy_session_key_cannot_claim_record(client):
    headers = login(client, "legacy@example.com")
    slug = client.get("/api/schemes").json()[0]["slug"]

    response = client.post(
        "/api/applications",
        json={
            "scheme_slug": slug,
            "session_key": "someone-elses-key",
        },
        headers=headers,
    )
    assert response.status_code == 422


def test_invalid_csrf_rejected(client):
    headers = login(client, "csrf@example.com")
    slug = client.get("/api/schemes").json()[0]["slug"]

    response = client.post(
        "/api/applications",
        json={"scheme_slug": slug},
        headers={"X-CSRF-Token": "invalid-token"},
    )
    assert response.status_code == 403

    assert client.get("/api/applications").json() == []
