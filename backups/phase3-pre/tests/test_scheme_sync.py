import json

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.scheme import Scheme
from app.services.seed import sync_schemes


def test_sync_updates_without_deleting(tmp_path):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    data = {
        "data_notice": "Test data only",
        "schemes": [
            {
                "name": "Test Scholarship",
                "slug": "test-scholarship",
                "description": "Original description",
                "benefit_summary": "Test benefit",
                "level": "State",
                "eligibility_conditions": [],
                "document_requirements": [],
                "application_steps": [],
                "official_url": "https://example.org",
                "application_deadline": None,
                "source_verified_on": None,
                "verification_status": "UNVERIFIED_ILLUSTRATIVE",
                "is_illustrative": True,
            }
        ],
    }

    path = tmp_path / "schemes.json"
    path.write_text(json.dumps(data), encoding="utf-8")

    with Session(engine) as db:
        first = sync_schemes(db, path)
        assert first == {"inserted": 1, "updated": 0}

        data["schemes"][0]["description"] = "Updated description"
        path.write_text(json.dumps(data), encoding="utf-8")

        second = sync_schemes(db, path)
        assert second == {"inserted": 0, "updated": 1}

        schemes = db.scalars(select(Scheme)).all()
        assert len(schemes) == 1
        assert schemes[0].description == "Updated description"

    engine.dispose()
