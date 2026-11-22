import pytest
from pydantic import ValidationError

from app.schemas.scheme import SchemeSeed


def programme(**overrides):
    data = {
        "name": "Test Programme",
        "slug": "test-programme",
        "description": "Unverified programme",
        "benefit_summary": "Unverified benefit",
        "level": "State",
        "eligibility_conditions": [],
        "document_requirements": [],
        "application_steps": [],
        "official_url": "https://example.org/",
        "application_deadline": None,
        "source_verified_on": None,
        "verification_status": "UNVERIFIED_PROGRAMME",
        "is_illustrative": False,
    }
    data.update(overrides)
    return data


def test_unverified_programme_accepts_empty_guidance():
    result = SchemeSeed.model_validate(programme())
    assert result.verification_status == "UNVERIFIED_PROGRAMME"


@pytest.mark.parametrize("changes", [
    {"is_illustrative": True},
    {"source_verified_on": "2026-11-22"},
    {"application_deadline": "2027-03-31"},
    {"deadline_verified_on": "2026-11-22"},
    {"eligibility_conditions": [
        {
            "field": "category",
            "operator": "eq",
            "value": "SC",
            "description": "Unverified category rule",
        }
    ]},
    {"document_requirements": ["Aadhaar"]},
    {"application_steps": ["Apply online"]},
])
def test_unverified_programme_rejects_unsupported_claims(changes):
    with pytest.raises(ValidationError):
        SchemeSeed.model_validate(programme(**changes))
