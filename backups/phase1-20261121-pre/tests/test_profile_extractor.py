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
            {"monthly_income": 20000.0},
        ),
        (
            "I earn 20k per month",
            {"monthly_income": 20000.0},
        ),
        (
            "My income is 180000",
            {"income_period_unknown": 180000.0},
        ),
        (
            "I am a student looking for a scholarship",
            {},
        ),
    ],
)
def test_profile_extraction(message, expected):
    assert extract_profile(message) == expected
