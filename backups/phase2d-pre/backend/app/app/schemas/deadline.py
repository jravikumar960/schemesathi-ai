from datetime import date

from pydantic import BaseModel


class DeadlineOut(BaseModel):
    slug: str
    name: str
    official_url: str
    academic_year: str | None
    deadline: date | None
    deadline_verified_on: date | None
    source_verified_on: date | None
    verification_status: str
    is_illustrative: bool
    deadline_status: str
    days_remaining: int | None
