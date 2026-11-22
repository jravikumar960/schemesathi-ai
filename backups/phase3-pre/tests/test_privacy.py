import pytest

from app.services.privacy import contains_sensitive_information


@pytest.mark.parametrize(
    "message",
    [
        "My Aadhaar number is 1234 5678 9012",
        "My aadhar is 123456789012",
        "My PAN is ABCDE1234F",
        "My passport number is available",
        "My ID is 1234-5678-9012",
    ],
)
def test_sensitive_information_rejected(message):
    assert contains_sensitive_information(message)


@pytest.mark.parametrize(
    "message",
    [
        "My annual family income is 1.8 lakh",
        "I am a Telangana student",
        "What scholarships are available?",
    ],
)
def test_safe_information_allowed(message):
    assert not contains_sensitive_information(message)
