from types import SimpleNamespace

import pytest

from app.services.eligibility import evaluate_condition, evaluate_scheme


def test_dict_missing_operator_returns_needs_information():
    condition = {"field": "annual_family_income", "value": 150000, "description": "Income"}
    result = evaluate_condition(condition, {"annual_family_income": 100000})
    assert result.status == "NEEDS_INFORMATION"


def test_dict_with_unknown_operator_returns_needs_information():
    # "bogus" is not in the Literal operator set of EligibilityCondition,
    # so model_validate rejects it.
    condition = {
        "field": "annual_family_income",
        "operator": "bogus",
        "value": 150000,
        "description": "Income",
    }
    result = evaluate_condition(condition, {"annual_family_income": 100000})
    assert result.status == "NEEDS_INFORMATION"


def test_object_without_attributes_returns_needs_information():
    result = evaluate_condition(object(), {})
    assert result.status == "NEEDS_INFORMATION"


def test_malformed_condition_in_scheme_is_never_eligible():
    scheme = SimpleNamespace(
        slug="x",
        name="X",
        verification_status="VERIFIED",
        is_illustrative=False,
        eligibility_conditions=[{"field": "annual_family_income"}],
    )
    result = evaluate_scheme(scheme, {"annual_family_income": 100000})
    assert result["status"] != "ELIGIBLE"
    assert result["status"] == "NEEDS_INFORMATION"


def test_valid_condition_still_passes():
    condition = {
        "field": "annual_family_income",
        "operator": "lte",
        "value": 150000,
        "description": "Annual family income ceiling",
    }
    result = evaluate_condition(condition, {"annual_family_income": 100000})
    assert result.status == "PASS"
