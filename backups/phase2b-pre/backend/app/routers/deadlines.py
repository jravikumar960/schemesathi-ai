from datetime import date
from pathlib import Path

from fastapi import APIRouter

from app.schemas.deadline import DeadlineOut
from app.services.deadlines import deadline_status
from app.services.seed import load_scheme_file

DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "schemes.json"

router = APIRouter(prefix="/deadlines", tags=["deadlines"])


@router.get("", response_model=list[DeadlineOut])
def list_deadlines() -> list[dict]:
    scheme_file = load_scheme_file(DATA_FILE)
    today = date.today()
    results: list[dict] = []
    for s in scheme_file.schemes:
        status, days = deadline_status(
            s.application_deadline,
            s.verification_status,
            s.is_illustrative,
            today,
        )
        results.append(
            {
                "slug": s.slug,
                "name": s.name,
                "official_url": s.official_url,
                "academic_year": s.academic_year,
                "deadline": s.application_deadline,
                "deadline_verified_on": s.deadline_verified_on,
                "source_verified_on": s.source_verified_on,
                "verification_status": s.verification_status,
                "is_illustrative": s.is_illustrative,
                "deadline_status": status,
                "days_remaining": days,
            }
        )
    return results
