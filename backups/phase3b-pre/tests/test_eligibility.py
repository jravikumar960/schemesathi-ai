from types import SimpleNamespace

import pytest

from app.schemas.scheme import EligibilityCondition
from app.services.eligibility import (
    evaluate_condition,
    evaluate_scheme,
)


def condition(field, operator, value):
    return EligibilityCondition(
        field=field,
        operator=operator,
        value=value,
        description=f"Check {field}",
    )


@pytest.mark.parametrize(
    "operator,expected,actual,status",
    [
        ("lte", 250000, 180000, "PASS"),
        ("lte", 250000, 250000, "PASS"),
        ("lte", 250000, 300000, "FAIL"),
        ("gte", 18, 18, "PASS"),
        ("gte", 18, 16, "FAIL"),
        ("eq", "Telangana", "Telangana", "PASS"),
        ("eq", "Telangana", "Karnataka", "FAIL"),
        ("in", ["SC", "ST"], "SC", "PASS"),
        ("in", ["SC", "ST"], "OC", "FAIL"),
        ("boolean", True, True, "PASS"),
        ("boolean", True, False, "FAIL"),
    ],
)
def test_rule_operators(operator, expected, actual, status):
    rule = condition("field", operator, expected)
    result = evaluate_condition(rule, {"field": actual})
    assert result.status == status


def test_missing_field():
    rule = condition("income", "lte", 250000)
    result = evaluate_condition(rule, {})
    assert result.status == "NEEDS_INFORMATION"


def test_invalid_numeric_input():
    rule = condition("income", "lte", 250000)
    result = evaluate_condition(rule, {"income": "unknown"})
    assert result.status == "NEEDS_INFORMATION"


def test_boolean_is_not_numeric():
    rule = condition("income", "lte", 250000)
    result = evaluate_condition(rule, {"income": True})
    assert result.status == "NEEDS_INFORMATION"


def test_database_dictionary_condition():
    rule = {
        "field": "income",
        "operator": "lte",
        "value": 250000,
        "description": "Income limit",
    }
    result = evaluate_condition(rule, {"income": 180000})
    assert result.status == "PASS"


def test_scheme_with_multiple_conditions():
    scheme = SimpleNamespace(
        slug="test-scheme",
        name="Test Scheme",
        eligibility_conditions=[
            condition("income", "lte", 250000),
            condition("age", "gte", 18),
        ],
        is_illustrative=True,
        verification_status="UNVERIFIED_ILLUSTRATIVE",
    )

    eligible = evaluate_scheme(
        scheme, {"income": 180000, "age": 20}
    )
    assert eligible["status"] == "ELIGIBLE"

    missing = evaluate_scheme(
        scheme, {"income": 180000}
    )
    assert missing["status"] == "NEEDS_INFORMATION"

    rejected = evaluate_scheme(
        scheme, {"income": 300000}
    )
    assert rejected["status"] == "NOT_ELIGIBLE"


def test_scheme_with_no_conditions():
    scheme = SimpleNamespace(
        slug="empty-scheme",
        name="Empty Scheme",
        eligibility_conditions=[],
        is_illustrative=True,
        verification_status="UNVERIFIED_ILLUSTRATIVE",
    )

    result = evaluate_scheme(scheme, {})
    assert result["status"] == "NEEDS_INFORMATION"
