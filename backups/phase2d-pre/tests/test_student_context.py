import pytest

from app.services.profile_extractor import extract_profile


@pytest.mark.parametrize(
    "message,expected",
    [
        (
            "I am a BC student from an urban area. "
            "My annual family income is 1.8 lakh.",
            {
                "category": "BC",
                "residence": "urban",
                "annual_family_income": 180000.0,
            },
        ),
        (
            "I belong to SC and live in a village.",
            {"category": "SC", "residence": "rural"},
        ),
        (
            "I am an ST student from a rural area.",
            {"category": "ST", "residence": "rural"},
        ),
        (
            "I am an EBC student living in a city.",
            {"category": "EBC", "residence": "urban"},
        ),
        (
            "I am a student in Telangana.",
            {},
        ),
    ],
)
def test_student_context_extraction(message, expected):
    assert extract_profile(message) == expected
