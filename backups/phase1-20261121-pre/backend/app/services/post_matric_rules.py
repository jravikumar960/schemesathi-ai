from typing import Any


INCOME_LIMITS = {
    "SC": 250000,
    "ST": 200000,
    "BC": {"rural": 150000, "urban": 200000},
    "EBC": {"rural": 150000, "urban": 200000},
    "MINORITY": {"rural": 150000, "urban": 200000},
    "DISABLED_WELFARE": 100000,
}


def evaluate_post_matric_income(profile: dict[str, Any]) -> dict:
    category = str(profile.get("category", "")).upper().strip()
    residence = str(profile.get("residence", "")).lower().strip()
    income = profile.get("annual_family_income")

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
        return {
            "status": "NEEDS_INFORMATION",
            "reason": "Valid annual family income is required.",
        }

    if income < 0:
        return {
            "status": "NEEDS_INFORMATION",
            "reason": "Annual family income cannot be negative.",
        }

    return {
        "status": "PASS" if income <= limit else "FAIL",
        "annual_income_limit": limit,
        "annual_family_income": income,
        "reason": (
            "Income is within the category-specific limit."
            if income <= limit
            else "Income exceeds the category-specific limit."
        ),
    }
