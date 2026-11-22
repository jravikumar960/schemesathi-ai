import json
from datetime import date, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.routers import deadlines as deadlines_router
from app.schemas.scheme import SchemeSeed
from app.services.deadlines import deadline_status

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "schemes.json"
TODAY = date(2026, 11, 21)
TELANGANA_SLUG = "telangana-post-matric-scholarships"


@pytest.fixture
def client():
    return TestClient(create_app())


def _load_raw_schemes() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8-sig"))


def _telangana_record() -> dict:
    for record in _load_raw_schemes()["schemes"]:
        if record["slug"] == TELANGANA_SLUG:
            return json.loads(json.dumps(record))
    raise AssertionError("Telangana record missing from data file")


# a) deadline_status ---------------------------------------------------------

def test_deadline_status_none_deadline():
    assert deadline_status(None, "VERIFIED", False, TODAY) == ("NO_VERIFIED_DEADLINE", None)


def test_deadline_status_future_deadline():
    deadline = TODAY + timedelta(days=10)
    assert deadline_status(deadline, "VERIFIED", False, TODAY) == ("UPCOMING", 10)


def test_deadline_status_same_day_is_upcoming_zero():
    assert deadline_status(TODAY, "VERIFIED", False, TODAY) == ("UPCOMING", 0)


def test_deadline_status_past_deadline_is_expired():
    deadline = TODAY - timedelta(days=5)
    assert deadline_status(deadline, "VERIFIED", False, TODAY) == ("EXPIRED", -5)


def test_deadline_status_verified_but_illustrative_is_unverified():
    deadline = TODAY + timedelta(days=10)
    assert deadline_status(deadline, "VERIFIED", True, TODAY) == ("UNVERIFIED", None)


def test_deadline_status_unverified_illustrative_status_is_unverified():
    deadline = TODAY + timedelta(days=10)
    assert deadline_status(
        deadline, "UNVERIFIED_ILLUSTRATIVE", False, TODAY
    ) == ("UNVERIFIED", None)


# b) schema ------------------------------------------------------------------

def _with_deadline_fields(record: dict) -> dict:
    record = dict(record)
    record["application_deadline"] = "2027-03-31"
    record["academic_year"] = "2026-27"
    record["deadline_verified_on"] = "2026-11-21"
    return record


def test_schema_accepts_verified_record_with_full_deadline_metadata():
    seed = SchemeSeed.model_validate(_with_deadline_fields(_telangana_record()))
    assert seed.application_deadline == date(2027, 3, 31)
    assert seed.academic_year == "2026-27"
    assert seed.deadline_verified_on == date(2026, 11, 21)


def test_schema_rejects_deadline_without_academic_year():
    record = _with_deadline_fields(_telangana_record())
    del record["academic_year"]
    with pytest.raises(ValidationError):
        SchemeSeed.model_validate(record)


def test_schema_rejects_deadline_without_deadline_verified_on():
    record = _with_deadline_fields(_telangana_record())
    del record["deadline_verified_on"]
    with pytest.raises(ValidationError):
        SchemeSeed.model_validate(record)


def test_schema_rejects_illustrative_status_with_deadline():
    record = _with_deadline_fields(_telangana_record())
    record["verification_status"] = "UNVERIFIED_ILLUSTRATIVE"
    record["is_illustrative"] = True
    with pytest.raises(ValidationError):
        SchemeSeed.model_validate(record)


# c) endpoint against the real data file --------------------------------------

def test_get_deadlines_returns_all_schemes_with_null_deadline_safe_fields(client):
    response = client.get("/api/deadlines")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 6

    telangana = next(item for item in items if item["slug"] == TELANGANA_SLUG)
    assert telangana["deadline"] is None
    assert telangana["deadline_status"] == "NO_VERIFIED_DEADLINE"
    assert telangana["days_remaining"] is None

    for item in items:
        if item["deadline"] is None:
            assert item["days_remaining"] is None


# d) endpoint against a temporary file ----------------------------------------

def test_get_deadlines_with_temp_file_upcoming_and_expired(client, tmp_path, monkeypatch):
    today = date.today()
    upcoming = _telangana_record()
    upcoming["application_deadline"] = (today + timedelta(days=10)).isoformat()
    upcoming["academic_year"] = "2026-27"
    upcoming["deadline_verified_on"] = today.isoformat()

    expired = _telangana_record()
    expired["slug"] = "test-expired"
    expired["application_deadline"] = (today - timedelta(days=5)).isoformat()
    expired["academic_year"] = "2026-27"
    expired["deadline_verified_on"] = today.isoformat()

    temp_file = tmp_path / "schemes.json"
    temp_file.write_text(
        json.dumps(
            {
                "data_notice": "Temporary test data.",
                "schemes": [upcoming, expired],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(deadlines_router, "DATA_FILE", temp_file)

    response = client.get("/api/deadlines")
    assert response.status_code == 200
    by_slug = {item["slug"]: item for item in response.json()}

    assert by_slug[TELANGANA_SLUG]["deadline_status"] == "UPCOMING"
    assert by_slug[TELANGANA_SLUG]["days_remaining"] == 10

    assert by_slug["test-expired"]["deadline_status"] == "EXPIRED"
    assert by_slug["test-expired"]["days_remaining"] == -5
