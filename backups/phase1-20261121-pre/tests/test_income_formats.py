import pytest

from app.services.profile_extractor import extract_profile


@pytest.mark.parametrize(
    "message,expected_field",
    [
        ("BC/urban/1.8 lakh income", "income_period_unknown"),
        ("BC/urban/1.8 lakh annual family income", "annual_family_income"),
        (
            "I am a BC student from an urban area. "
            "My annual family income is 1.8 lakh.",
            "annual_family_income",
        ),
        ("My monthly income is 18000", "monthly_income"),
        ("Income 180000 per year", "annual_family_income"),
    ],
)
def test_income_formats(message, expected_field):
    profile = extract_profile(message)

    assert profile[expected_field] == 180000 if (
        expected_field != "monthly_income"
    ) else profile[expected_field] == 18000


def test_shorthand_student_context():
    profile = extract_profile("BC/urban/1.8 lakh income")

    assert profile["category"] == "BC"
    assert profile["residence"] == "urban"
    assert profile["income_period_unknown"] == 180000


def test_ambiguous_income_not_assumed_annual():
    profile = extract_profile("My income is 1.8 lakh")

    assert "annual_family_income" not in profile
    assert profile["income_period_unknown"] == 180000
