from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_key: str = Field(min_length=1, max_length=64)
    scheme_slug: str

    @model_validator(mode="before")
    @classmethod
    def reject_aadhaar_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in data:
                if "aadhaar" in str(key).lower():
                    raise ValueError("Aadhaar numbers must not be submitted")
        return data


class ApplicationStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ApplicationStatus


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_key: str
    scheme_id: int
    scheme_slug: str
    status: ApplicationStatus
    updated_at: datetime

