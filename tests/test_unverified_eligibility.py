from types import SimpleNamespace

from app.services.eligibility import evaluate_scheme
from app.services.agent import explain_node


def make_scheme(status, rules=None):
    return SimpleNamespace(
        slug="test-programme",
        name="Test Programme",
        verification_status=status,
        is_illustrative=False,
        eligibility_conditions=rules or [],
    )


def test_unverified_programme_never_claims_eligibility():
    scheme = make_scheme(
        "UNVERIFIED_PROGRAMME",
        [{
            "field": "income",
            "operator": "lte",
            "value": 200000,
            "description": "Test income rule",
        }],
    )

    result = evaluate_scheme(
        scheme,
        {"income": 100000},
    )

    assert result["status"] == "NOT_DETERMINED"
    assert result["rules"] == []
    assert "not been verified" in result["reason"]


def test_unverified_programme_is_not_presented_as_recommendation():
    result = evaluate_scheme(
        make_scheme("UNVERIFIED_PROGRAMME"),
        {},
    )

    explanation = explain_node({
        "results": [result],
        "post_matric_income": {},
    })["response"]

    assert "Test Programme:" not in explanation
    assert "preliminary assessment" in explanation


def test_verified_empty_rules_do_not_claim_eligibility():
    result = evaluate_scheme(
        make_scheme("VERIFIED"),
        {},
    )

    assert result["status"] == "NEEDS_INFORMATION"
