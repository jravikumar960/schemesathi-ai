import re


AMOUNT = r"(?<![\w.])([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|k)?\b"

INCOME_WORDS = r"(?:income|earnings|salary|earn|earning)"

CATEGORY_PATTERNS = {
    "SC": r"\b(?:sc|scheduled caste)\b",
    "ST": r"\b(?:st|scheduled tribe)\b",
    "BC": r"\b(?:bc|backward class(?:es)?)\b",
    "EBC": r"\b(?:ebc|economically backward class(?:es)?)\b",
    "MINORITY": r"\bminority\b",
}


def parse_amount(match):
    amount = float(match.group(1).replace(",", ""))
    unit = match.group(2)

    if unit in ("lakh", "lakhs", "lac", "lacs"):
        amount *= 100000
    elif unit == "k":
        amount *= 1000

    return amount


def extract_income(text):
    patterns = [
        rf"\b{INCOME_WORDS}\b[^\d]{{0,50}}(?:rs\.?|₹|inr)?\s*{AMOUNT}",
        rf"(?:rs\.?|₹|inr)?\s*{AMOUNT}[^\n.!?]{{0,35}}\b{INCOME_WORDS}\b",
    ]

    amount = None

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            amount = parse_amount(match)
            break

    if amount is None:
        return {}

    monthly = bool(
        re.search(r"\b(?:per month|monthly|/month)\b", text)
    )

    annual = bool(
        re.search(r"\b(?:per year|yearly|annual|annually|/year)\b", text)
    )

    if monthly and annual:
        return {"income_period_unknown": amount}

    if monthly:
        return {"monthly_income": amount}

    if annual:
        return {"annual_family_income": amount}

    return {"income_period_unknown": amount}


def extract_student_context(text):
    profile = {}

    categories = [
        category
        for category, pattern in CATEGORY_PATTERNS.items()
        if re.search(pattern, text)
    ]

    if len(categories) == 1:
        profile["category"] = categories[0]

    rural = bool(re.search(r"\b(?:rural|village)\b", text))
    urban = bool(re.search(r"\b(?:urban|city|town)\b", text))

    if rural != urban:
        profile["residence"] = "rural" if rural else "urban"

    return profile


def extract_profile(message: str) -> dict:
    text = message.lower()

    profile = extract_income(text)
    profile.update(extract_student_context(text))

    return profile
