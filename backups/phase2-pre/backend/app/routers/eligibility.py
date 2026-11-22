from app.schemas.safe_profile import SafeProfileRequest
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheme import Scheme
from app.services.eligibility import evaluate_scheme

router = APIRouter(prefix="/eligibility", tags=["eligibility"])


class EligibilityRequest(SafeProfileRequest):
    scheme_slug: str | None = None


@router.post("/check")
def check_eligibility(
    payload: EligibilityRequest,
    db: Session = Depends(get_db),
):
    query = select(Scheme).order_by(Scheme.id)

    if payload.scheme_slug:
        query = query.where(Scheme.slug == payload.scheme_slug)

    schemes = db.scalars(query).all()

    if payload.scheme_slug and not schemes:
        raise HTTPException(
            status_code=404,
            detail="Scheme not found",
        )

    return {
        "results": [
            evaluate_scheme(scheme, payload.profile)
            for scheme in schemes
        ],
        "disclaimer": (
            "Preliminary rule-based assessment only. "
            "Verify eligibility with official scheme authorities."
        ),
    }
