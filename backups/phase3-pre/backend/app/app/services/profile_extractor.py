import re


AMOUNT = r"(?<![\w.])([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|k)?\b"

INCOME_WORDS = r"(?:income|earnings|salary|earn|earning)"

MONTHLY_PERIOD = r"(?:\bmonthly\b|\bper month\b|/\s*month\b|\ba month\b)"

ANNUAL_PERIOD = (
    r"(?:\b(?:annual(?:ly)?|anual)\b|\byearly\b|\bper year\b"
    r"|\bper annum\b|\bp\.a\b|/\s*year\b)"
)

# Family wording directly attached to an income word, e.g. "family income",
# "household income", "parents' income", "family's annual income".
FAMILY_INCOME = (
    r"\b(?:family|families|household|parents?)(?:'s|’s|')?\s+"
    r"(?:\w+\s+){0,2}?(?:income|earnings|salary)\b"
)

# Personal wording, e.g. "my salary", "my monthly income", "my income",
# "I earn". A family word inside the phrase blocks this match.
PERSONAL_INCOME = (
    r"\b(?:my(?:\s+(?!family|families|household|parents?\b)[\w']+){0,2}?"
    r"\s+(?:salary|earnings?|income|pay|wage)|i\s+(?:earn|make))\b"
)

# Sentence boundary: ! ? or newline, or a full stop followed by whitespace
# or end of text. A decimal point ("1.8") and "p.a." do not match.
SENTENCE_BOUNDARY = re.compile(r"[!?\n]|\.(?=\s|$)")

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


def _sentence_around(text, start, end):
    left = 0
    for boundary in SENTENCE_BOUNDARY.finditer(text, 0, start):
        left = boundary.end()

    right = len(text)
    boundary = SENTENCE_BOUNDARY.search(text, end)
    if boundary:
        right = boundary.start()

    return text[left:right]


def _detect_period(sentence):
    monthly = bool(re.search(MONTHLY_PERIOD, sentence))
    annual = bool(re.search(ANNUAL_PERIOD, sentence))

    if monthly and annual:
        return "ambiguous"
    if monthly:
        return "monthly"
    if annual:
        return "annual"
    return "unknown"


def _detect_meaning(sentence):
    family = bool(re.search(FAMILY_INCOME, sentence))
    personal = bool(re.search(PERSONAL_INCOME, sentence))

    if family and personal:
        return "ambiguous"
    if family:
        return "family"
    if personal:
        return "personal"
    return "unknown"


def extract_income(text):
    patterns = [
        rf"\b{INCOME_WORDS}\b[^\d]{{0,50}}(?:rs\.?|₹|inr)?\s*{AMOUNT}",
        rf"(?:rs\.?|₹|inr)?\s*{AMOUNT}[^\n.!?]{{0,35}}\b{INCOME_WORDS}\b",
    ]

    match = None

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            break

    if match is None:
        return {}

    amount = parse_amount(match)
    sentence = _sentence_around(text, match.start(), match.end())
    period = _detect_period(sentence)
    meaning = _detect_meaning(sentence)

    if meaning == "family":
        if period == "annual":
            return {"annual_family_income": amount}
        if period == "monthly":
            return {"monthly_family_income": amount}
        return {"income_period_unknown": amount}

    if meaning == "personal":
        return {
            "personal_income_amount": amount,
            "personal_income_period": (
                period if period in ("annual", "monthly") else "unknown"
            ),
        }

    # Meaning is unclear (bare "income", or both personal and family
    # wording). Do not guess: record the amount for a follow-up question.
    if period in ("annual", "monthly"):
        return {
            "income_meaning_unknown": amount,
            "income_meaning_period": period,
        }

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
