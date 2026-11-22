from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EligibilityCondition(BaseModel):
    field: str
    operator: Literal["gte", "lte", "eq", "in", "boolean"]
    value: str | int | float | bool | list[str]
    description: str


class SchemeSeed(BaseModel):
    name: str
    slug: str
    description: str
    benefit_summary: str
    level: str
    eligibility_conditions: list[EligibilityCondition]
    document_requirements: list[str]
    application_steps: list[str]
    official_url: str
    application_deadline: date | None = None
    source_verified_on: date | None = None
    verification_status: Literal["VERIFIED", "UNVERIFIED_ILLUSTRATIVE", "UNVERIFIED_PROGRAMME"]
    is_illustrative: bool
    academic_year: str | None = Field(default=None, exclude=True)
    deadline_verified_on: date | None = Field(default=None, exclude=True)

    @model_validator(mode="after")
    def check_verification_rules(self):
        if self.application_deadline is not None:
            if self.verification_status != "VERIFIED":
                raise ValueError(
                    "schemes with an application_deadline must have verification_status VERIFIED"
                )
            if self.deadline_verified_on is None:
                raise ValueError(
                    "schemes with an application_deadline must have deadline_verified_on set"
                )
            if self.academic_year is None or not self.academic_year.strip():
                raise ValueError(
                    "schemes with an application_deadline must have a non-empty academic_year"
                )
        if self.verification_status == "UNVERIFIED_ILLUSTRATIVE":
            if self.application_deadline is not None:
                raise ValueError(
                    "UNVERIFIED_ILLUSTRATIVE schemes must have application_deadline null"
                )
            if not self.is_illustrative:
                raise ValueError(
                    "UNVERIFIED_ILLUSTRATIVE schemes must have is_illustrative true"
                )
        elif self.verification_status == "UNVERIFIED_PROGRAMME":
            if self.is_illustrative:
                raise ValueError(
                    "UNVERIFIED_PROGRAMME must not be illustrative"
                )
            if self.source_verified_on is not None:
                raise ValueError(
                    "UNVERIFIED_PROGRAMME cannot claim a verification date"
                )
            if self.deadline_verified_on is not None:
                raise ValueError(
                    "UNVERIFIED_PROGRAMME cannot claim deadline verification"
                )
            if self.eligibility_conditions:
                raise ValueError(
                    "UNVERIFIED_PROGRAMME cannot contain unverified eligibility rules"
                )
            if self.document_requirements or self.application_steps:
                raise ValueError(
                    "UNVERIFIED_PROGRAMME cannot contain unverified guidance"
                )
        elif self.verification_status == "VERIFIED":
            if self.is_illustrative:
                raise ValueError("VERIFIED schemes cannot be illustrative")
            if self.source_verified_on is None:
                raise ValueError("VERIFIED schemes must have source_verified_on set")
        return self


class SchemeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    benefit_summary: str
    level: str
    eligibility_conditions: list[EligibilityCondition]
    document_requirements: list[str]
    application_steps: list[str]
    official_url: str
    application_deadline: date | None
    source_verified_on: date | None
    verification_status: str
    is_illustrative: bool
    last_updated: datetime


class SchemeFile(BaseModel):
    data_notice: str
    schemes: list[SchemeSeed]

