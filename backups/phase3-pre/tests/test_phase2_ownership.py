"""Phase 2 ownership regression tests for application routes.

Each test uses a distinct session string. The `client` fixture from
tests/conftest.py provides a per-test database.
"""

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


SCHEME_SLUG = "telangana-post-matric-scholarships"


def _create_application(client, session_key):
    response = client.post(
        "/api/applications",
        json={"session_key": session_key, "scheme_slug": SCHEME_SLUG},
    )
    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    return body["id"]


def _list_applications(client, session_key):
    response = client.get(f"/api/applications?session_key={session_key}")
    assert response.status_code == 200
    return response.json()


def test_owner_can_update_status(client):
    session_key = "phase2-owner"
    app_id = _create_application(client, session_key)

    response = client.patch(
        f"/api/applications/{app_id}?session_key={session_key}",
        json={"status": "IN_PROGRESS"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_other_session_cannot_update_status(client):
    owner_key = "phase2-owner-update"
    attacker_key = "phase2-attacker-update"
    app_id = _create_application(client, owner_key)

    response = client.patch(
        f"/api/applications/{app_id}?session_key={attacker_key}",
        json={"status": "COMPLETED"},
    )

    assert response.status_code == 404

    records = _list_applications(client, owner_key)
    matching = [item for item in records if item["id"] == app_id]
    assert len(matching) == 1
    assert matching[0]["status"] == "NOT_STARTED"


def test_other_session_cannot_see_record(client):
    owner_key = "phase2-owner-visibility"
    attacker_key = "phase2-attacker-visibility"
    app_id = _create_application(client, owner_key)

    records = _list_applications(client, attacker_key)
    ids = [item["id"] for item in records]

    assert app_id not in ids


def test_missing_session_key_rejected_on_patch(client):
    owner_key = "phase2-owner-missing-key"
    app_id = _create_application(client, owner_key)

    response = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "COMPLETED"},
    )

    assert response.status_code == 422

    records = _list_applications(client, owner_key)
    matching = [item for item in records if item["id"] == app_id]
    assert len(matching) == 1
    assert matching[0]["status"] == "NOT_STARTED"


def test_owner_record_not_deleted_by_other_session_attempt(client):
    owner_key = "phase2-owner-survival"
    attacker_key = "phase2-attacker-survival"
    app_id = _create_application(client, owner_key)

    attack = client.patch(
        f"/api/applications/{app_id}?session_key={attacker_key}",
        json={"status": "COMPLETED"},
    )
    assert attack.status_code == 404

    records = _list_applications(client, owner_key)
    ids = [item["id"] for item in records]

    assert app_id in ids
