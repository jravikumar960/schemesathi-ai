from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheme import Scheme
from app.services.agent import agent
from app.services.post_matric_rules import evaluate_post_matric_income
from app.services.profile_extractor import extract_profile
from app.services.privacy import contains_sensitive_information
from app.services.scheme_groups import group_by_status

router = APIRouter(prefix="/chat", tags=["chat"])

OFFICIAL_SLUG = "telangana-post-matric-scholarships"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    course_mode: str | None = None
    admission_type: str | None = None


def build_recommendation(db: Session, profile: dict) -> dict | None:
    scheme = db.scalar(
        select(Scheme).where(
            Scheme.slug == OFFICIAL_SLUG,
            Scheme.is_illustrative.is_(False),
            Scheme.verification_status == "VERIFIED",
        )
    )

    if scheme is None:
        return None

    income = evaluate_post_matric_income(profile)

    return {
        "scheme_name": scheme.name,
        "scheme_slug": scheme.slug,
        "description": scheme.description,
        "benefit_summary": scheme.benefit_summary,
        "income_assessment": income,
        "overall_eligibility": "NOT_DETERMINED",
        "document_requirements": scheme.document_requirements,
        "application_steps": scheme.application_steps,
        "official_url": scheme.official_url,
        "source_verified_on": (
            scheme.source_verified_on.isoformat()
            if scheme.source_verified_on else None
        ),
        "disclaimer": (
            "This is an income-only preliminary assessment. "
            "Other eligibility requirements must be checked on "
            "the official Telangana ePASS portal. "
            "Do not provide identity numbers to SchemeSathi."
        ),
    }


@router.post("")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    if contains_sensitive_information(payload.message):
        raise HTTPException(
            status_code=422,
            detail=(
                "Do not submit Aadhaar, PAN, passport or other "
                "sensitive identification details."
            ),
        )

    profile = extract_profile(payload.message)
    # Structured follow-up answers override guesses from natural-language extraction.
    # Do not infer approval from an unknown or unsupported answer.
    if payload.course_mode is not None:
        if payload.course_mode not in {"regular", "part_time", "distance", "online", "unknown"}:
            raise HTTPException(status_code=422, detail="Invalid course mode")
        profile.pop("regular_course", None)
        if payload.course_mode != "unknown":
            profile["regular_course"] = payload.course_mode == "regular"
    if payload.admission_type is not None:
        if payload.admission_type not in {"convener", "management_quota", "sponsored", "spot_admission", "unknown"}:
            raise HTTPException(status_code=422, detail="Invalid admission type")
        profile.pop("eligible_admission", None)
        if payload.admission_type != "unknown":
            profile["eligible_admission"] = payload.admission_type == "convener"

    if any(
        key in profile
        for key in (
            "income_period_unknown",
            "income_meaning_unknown",
            "personal_income_amount",
        )
    ):
        return {
            "response": (
                "Is the income you mentioned your personal salary or "
                "total family income, and is it monthly or annual?"
            ),
            "extracted_profile": profile,
            "results": [],
            "recommendation": None,
            "scheme_groups": {
                "eligible": [],
                "needs_information": [],
                "not_eligible": [],
                "not_determined": [],
            },
            "disclaimer": (
                "Please clarify whether the income is personal or "
                "family income, and its period."
            ),
        }

    schemes = db.scalars(
        select(Scheme).where(Scheme.verification_status == "VERIFIED", Scheme.is_illustrative.is_(False)).order_by(Scheme.id)
    ).all()

    result = agent.invoke({
        "profile": profile,
        "schemes": list(schemes),
    })

    recommendation = None  # Rule-level results are the source of truth, not an income-only shortcut.

    return {
        "response": result["response"],
        "extracted_profile": profile,
        "results": result["results"],
        "recommendation": recommendation,
        "scheme_groups": group_by_status(result["results"]),
        "disclaimer": (
            "Only source-backed rules are evaluated. Likely eligible is never guaranteed; "
            "missing details require follow-up and official decisions belong to the authority."
        ),
    }
