import re


SENSITIVE_PATTERNS = [
    re.compile(r"\b(?:aadhaar|aadhar|uidai|pan|passport)\b", re.I),
    re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),
]


def contains_sensitive_information(message: str) -> bool:
    return any(
        pattern.search(message)
        for pattern in SENSITIVE_PATTERNS
    )
