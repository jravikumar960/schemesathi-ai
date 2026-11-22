import pytest

from app.services.profile_extractor import extract_profile


@pytest.mark.parametrize(
    "message,expected",
    [
        (
            "My annual family income is 1.8 lakh",
            {"annual_family_income": 180000.0},
        ),
        (
            "My family income is 250000 per year",
            {"annual_family_income": 250000.0},
        ),
        (
            "My monthly income is 20000",
            {
                "personal_income_amount": 20000.0,
                "personal_income_period": "monthly",
            },
        ),
        (
            "I earn 20k per month",
            {
                "personal_income_amount": 20000.0,
                "personal_income_period": "monthly",
            },
        ),
        (
            "My income is 180000",
            {
                "personal_income_amount": 180000.0,
                "personal_income_period": "unknown",
            },
        ),
        (
            "I am a student looking for a scholarship",
            {},
        ),
    ],
)
def test_profile_extraction(message, expected):
    assert extract_profile(message) == expected
