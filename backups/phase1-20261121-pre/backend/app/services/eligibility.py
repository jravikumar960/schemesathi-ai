from dataclasses import dataclass
from app.schemas.scheme import EligibilityCondition
from typing import Any


@dataclass
class RuleResult:
    field: str
    operator: str
    expected: Any
    actual: Any
    status: str
    explanation: str


def evaluate_condition(condition, profile: dict) -> RuleResult:
    if isinstance(condition, dict):
        condition = EligibilityCondition.model_validate(condition)

    field = condition.field
    operator = condition.operator
    expected = condition.value
    description = condition.description

    if field not in profile or profile[field] is None:
        return RuleResult(
            field, operator, expected, None,
            "NEEDS_INFORMATION",
            f"Missing information: {description}",
        )

    actual = profile[field]

    try:
        if operator in ("gte", "lte"):
            if (
                isinstance(actual, bool)
                or isinstance(expected, bool)
                or not isinstance(actual, (int, float))
                or not isinstance(expected, (int, float))
            ):
                raise ValueError("Expected numeric values")

            passed = (
                actual >= expected
                if operator == "gte"
                else actual <= expected
            )

        elif operator == "eq":
            if type(actual) is not type(expected):
                raise ValueError("Value types do not match")
            passed = actual == expected

        elif operator == "in":
            if not isinstance(expected, list):
                raise ValueError("Expected a list of allowed values")
            if not isinstance(actual, str):
                raise ValueError("Expected a string value")
            passed = actual in expected

        elif operator == "boolean":
            if not isinstance(actual, bool) or not isinstance(expected, bool):
                raise ValueError("Expected boolean values")
            passed = actual == expected

        else:
            raise ValueError("Unsupported operator")

    except (TypeError, ValueError) as exc:
        return RuleResult(
            field, operator, expected, actual,
            "NEEDS_INFORMATION",
            f"Invalid information for {field}: {exc}",
        )

    return RuleResult(
        field, operator, expected, actual,
        "PASS" if passed else "FAIL",
        description,
    )


def evaluate_scheme(scheme, profile: dict) -> dict:
    results = [
        evaluate_condition(condition, profile)
        for condition in scheme.eligibility_conditions
    ]

    statuses = [result.status for result in results]

    if "FAIL" in statuses:
        status = "NOT_ELIGIBLE"
    elif "NEEDS_INFORMATION" in statuses:
        status = "NEEDS_INFORMATION"
    elif not statuses:
        status = "NEEDS_INFORMATION"
    else:
        status = "ELIGIBLE"

    return {
        "scheme_slug": scheme.slug,
        "scheme_name": scheme.name,
        "status": status,
        "rules": [vars(result) for result in results],
        "is_illustrative": scheme.is_illustrative,
        "verification_status": scheme.verification_status,
    }
