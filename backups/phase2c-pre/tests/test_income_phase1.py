import pytest

from app.services.post_matric_rules import evaluate_post_matric_income
from app.services.profile_extractor import extract_profile
from tests.test_api import client


# 1. Explicit annual family income, including the misspelling "anual".
@pytest.mark.parametrize(
    "message",
    [
        "My anual family income is 2 lakh",
        "My annual family income is 2 lakh",
        "My family income is 2 lakh yearly",
        "My family income is 2 lakh annually",
        "My family income is 2 lakh per annum",
        "My family income is 2 lakh p.a.",
        "My family income is 200000/year",
        "My family income is 200000 per year",
    ],
)
def test_explicit_annual_family_income(message):
    profile = extract_profile(message)

    assert profile == {"annual_family_income": 200000.0}


# 2. Explicit monthly family income is kept as monthly and converted x12.
def test_monthly_family_income_is_kept_as_monthly():
    profile = extract_profile("My family's monthly income is 18000")

    assert profile == {"monthly_family_income": 18000.0}


def test_monthly_family_income_converted_to_annual():
    profile = extract_profile("My family's monthly income is 18000")
    result = evaluate_post_matric_income(
        {"category": "SC", "residence": "urban", **profile}
    )

    assert result["annual_family_income"] == 216000
    assert result["monthly_family_income"] == 18000
    assert result["status"] == "PASS"
    assert "Monthly family income converted to annual (\u00d7 12)." in (
        result["reason"]
    )


def test_monthly_family_income_converted_can_fail():
    result = evaluate_post_matric_income(
        {"category": "SC", "monthly_family_income": 20834}
    )

    assert result["annual_family_income"] == 250008
    assert result["status"] == "FAIL"


# 3. Personal salary is never written into family income.
@pytest.mark.parametrize(
    "message,expected_amount,expected_period",
    [
        ("My salary is 18000 per month", 18000.0, "monthly"),
        ("I earn 20k per month", 20000.0, "monthly"),
        ("My earnings are 2 lakh per year", 200000.0, "annual"),
        ("My monthly income is 18000", 18000.0, "monthly"),
        ("My income is 180000", 180000.0, "unknown"),
    ],
)
def test_personal_income_is_not_family_income(
    message, expected_amount, expected_period
):
    profile = extract_profile(message)

    assert profile == {
        "personal_income_amount": expected_amount,
        "personal_income_period": expected_period,
    }
    assert "annual_family_income" not in profile
    assert "monthly_family_income" not in profile


@pytest.mark.parametrize(
    "message",
    [
        "BC/urban/my salary is 1.8 lakh per year",
        "BC/urban/I earn 20k per month",
        "BC/urban/my monthly income is 18000",
    ],
)
def test_personal_income_alone_never_gives_pass_or_fail(message):
    profile = extract_profile(message)
    result = evaluate_post_matric_income(profile)

    assert result["status"] == "NEEDS_INFORMATION"
    assert "total annual family income is required" in result["reason"]


def test_household_and_parents_income_are_family_income():
    assert extract_profile("Household income is 2 lakh per year") == {
        "annual_family_income": 200000.0,
    }
    assert extract_profile("Parents' income is 2 lakh per year") == {
        "annual_family_income": 200000.0,
    }


# 4. Ambiguous period asks a follow-up (no guessing).
def test_ambiguous_period_gives_income_period_unknown():
    profile = extract_profile(
        "My family income is 1.8 lakh, monthly or yearly"
    )

    assert profile == {"income_period_unknown": 180000.0}


def test_bare_income_without_period_asks_follow_up():
    profile = extract_profile("BC/urban/1.8 lakh income")

    assert profile["income_period_unknown"] == 180000
    assert "annual_family_income" not in profile


# 5. Ambiguous meaning asks a follow-up (no guessing).
def test_ambiguous_meaning_with_annual_period_is_not_family_income():
    profile = extract_profile("Income 180000 per year")

    assert profile == {
        "income_meaning_unknown": 180000.0,
        "income_meaning_period": "annual",
    }
    assert "annual_family_income" not in profile


# 6. Each amount format.
@pytest.mark.parametrize(
    "amount_text",
    ["1.8 lakh", "1.8 lakhs", "1,80,000", "180000", "180k", "1.8 lac"],
)
def test_amount_formats(amount_text):
    profile = extract_profile(f"My annual family income is {amount_text}")

    assert profile == {"annual_family_income": 180000.0}


# 7. PASS / FAIL / NEEDS_INFORMATION around the SC limit of 250000.
@pytest.mark.parametrize(
    "income,expected_status",
    [
        (250000, "PASS"),
        (250001, "FAIL"),
        (None, "NEEDS_INFORMATION"),
    ],
)
def test_sc_limit_boundary(income, expected_status):
    profile = {"category": "SC"}
    if income is not None:
        profile["annual_family_income"] = income

    result = evaluate_post_matric_income(profile)

    assert result["status"] == expected_status


# Chat follow-up behaviour (route level).
def test_chat_asks_personal_or_family_for_personal_salary(client):
    response = client.post(
        "/api/chat",
        json={"message": "BC/urban/my salary is 1.8 lakh per year"},
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["recommendation"] is None
    assert "personal salary or total family income" in data["response"]
    assert "monthly or annual" in data["response"]


def test_chat_asks_follow_up_for_ambiguous_meaning(client):
    response = client.post(
        "/api/chat",
        json={"message": "BC/urban/Income 180000 per year"},
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["recommendation"] is None
    assert "personal salary or total family income" in data["response"]
