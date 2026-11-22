from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.services.privacy import contains_sensitive_information


SENSITIVE_KEYS = {
    "aadhaar",
    "aadhar",
    "aadhaar_number",
    "aadhar_number",
    "pan",
    "pan_number",
    "passport",
    "passport_number",
    "uidai",
}


def validate_profile(profile: dict[str, Any]) -> dict[str, Any]:
    def check(value: Any) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                normalized = key.lower().replace("-", "_").replace(" ", "_")

                if (
                    normalized in SENSITIVE_KEYS
                    or "aadhaar" in normalized
                    or "aadhar" in normalized
                    or "passport" in normalized
                    or normalized.startswith("pan_")
                ):
                    raise ValueError(
                        "Sensitive identification fields are not allowed."
                    )

                check(item)

        elif isinstance(value, list):
            for item in value:
                check(item)

        elif isinstance(value, str):
            if contains_sensitive_information(value):
                raise ValueError(
                    "Sensitive identification information is not allowed."
                )

    check(profile)
    return profile


class SafeProfileRequest(BaseModel):
    profile: dict[str, Any] = Field(default_factory=dict)

    @field_validator("profile")
    @classmethod
    def reject_sensitive_profile(cls, value: dict[str, Any]):
        return validate_profile(value)
