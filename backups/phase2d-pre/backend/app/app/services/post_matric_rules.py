from typing import Any


INCOME_LIMITS = {
    "SC": 250000,
    "ST": 200000,
    "BC": {"rural": 150000, "urban": 200000},
    "EBC": {"rural": 150000, "urban": 200000},
    "MINORITY": {"rural": 150000, "urban": 200000},
    "DISABLED_WELFARE": 100000,
}

CONVERSION_NOTE = "Monthly family income converted to annual (\u00d7 12)."


def _annual_family_income(profile: dict[str, Any]) -> tuple[Any, bool]:
    """Return (annual income, whether it was converted from monthly)."""
    annual = profile.get("annual_family_income")
    if annual is not None:
        return annual, False

    monthly = profile.get("monthly_family_income")
    if isinstance(monthly, (int, float)) and not isinstance(monthly, bool):
        return monthly * 12, True

    return annual, False


def evaluate_post_matric_income(profile: dict[str, Any]) -> dict:
    category = str(profile.get("category", "")).upper().strip()
    residence = str(profile.get("residence", "")).lower().strip()
    income, converted = _annual_family_income(profile)

    if not category:
        return {
            "status": "NEEDS_INFORMATION",
            "reason": "Student category is required.",
        }

    if category not in INCOME_LIMITS:
        return {
            "status": "NEEDS_INFORMATION",
            "reason": "Category is not supported or requires verification.",
        }

    limit = INCOME_LIMITS[category]

    if isinstance(limit, dict):
        if residence not in ("rural", "urban"):
            return {
                "status": "NEEDS_INFORMATION",
                "reason": "Rural or urban residence is required.",
            }
        limit = limit[residence]

    if isinstance(income, bool) or not isinstance(income, (int, float)):
        if profile.get("personal_income_amount") is not None:
            reason = (
                "Only personal income was provided; "
                "total annual family income is required."
            )
        else:
            reason = "Valid annual family income is required."
        return {
            "status": "NEEDS_INFORMATION",
            "reason": reason,
        }

    if income < 0:
        return {
            "status": "NEEDS_INFORMATION",
            "reason": "Annual family income cannot be negative.",
        }

    outcome = (
        "Income is within the category-specific limit."
        if income <= limit
        else "Income exceeds the category-specific limit."
    )

    result = {
        "status": "PASS" if income <= limit else "FAIL",
        "annual_income_limit": limit,
        "annual_family_income": income,
        "reason": f"{CONVERSION_NOTE} {outcome}" if converted else outcome,
    }

    if converted:
        result["monthly_family_income"] = profile["monthly_family_income"]

    return result
