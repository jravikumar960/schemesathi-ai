from app.schemas.safe_profile import SafeProfileRequest
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheme import Scheme
from app.services.agent import agent

router = APIRouter(prefix="/agent", tags=["agent"])


class AgentRequest(BaseModel):
    profile: dict[str, Any] = Field(default_factory=dict)


@router.post("/evaluate")
def evaluate_with_agent(
    payload: SafeProfileRequest,
    db: Session = Depends(get_db),
):
    schemes = db.scalars(
        select(Scheme).order_by(Scheme.id)
    ).all()

    result = agent.invoke({
        "profile": payload.profile,
        "schemes": list(schemes),
    })

    return {
        "response": result["response"],
        "results": result["results"],
        "disclaimer": (
            "Preliminary assessment only. "
            "Illustrative schemes are not verified benefits."
        ),
    }
