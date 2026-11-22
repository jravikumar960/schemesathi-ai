import pytest

from app.services.post_matric_rules import evaluate_post_matric_income


@pytest.mark.parametrize(
    "profile,expected_status",
    [
        ({"category": "SC", "annual_family_income": 250000}, "PASS"),
        ({"category": "SC", "annual_family_income": 260000}, "FAIL"),
        ({"category": "ST", "annual_family_income": 200000}, "PASS"),
        ({"category": "ST", "annual_family_income": 210000}, "FAIL"),
        (
            {
                "category": "BC",
                "residence": "rural",
                "annual_family_income": 160000,
            },
            "FAIL",
        ),
        (
            {
                "category": "BC",
                "residence": "urban",
                "annual_family_income": 160000,
            },
            "PASS",
        ),
        (
            {
                "category": "MINORITY",
                "residence": "rural",
                "annual_family_income": 140000,
            },
            "PASS",
        ),
        ({"category": "SC"}, "NEEDS_INFORMATION"),
        ({"annual_family_income": 180000}, "NEEDS_INFORMATION"),
        (
            {"category": "SC", "annual_family_income": -100},
            "NEEDS_INFORMATION",
        ),
        (
            {"category": "SC", "annual_family_income": True},
            "NEEDS_INFORMATION",
        ),
    ],
)
def test_post_matric_income(profile, expected_status):
    result = evaluate_post_matric_income(profile)
    assert result["status"] == expected_status
