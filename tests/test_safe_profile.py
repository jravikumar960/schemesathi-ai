import pytest
from pydantic import ValidationError

from app.schemas.safe_profile import SafeProfileRequest


@pytest.mark.parametrize(
    "profile",
    [
        {"aadhaar_number": "123456789012"},
        {"aadhar": "123456789012"},
        {"pan_number": "ABCDE1234F"},
        {"passport_number": "A1234567"},
        {"details": {"aadhaar_number": "123456789012"}},
        {"notes": "My Aadhaar is 1234 5678 9012"},
    ],
)
def test_sensitive_profiles_rejected(profile):
    with pytest.raises(ValidationError):
        SafeProfileRequest(profile=profile)


def test_normal_profile_accepted():
    request = SafeProfileRequest(
        profile={
            "annual_family_income": 180000,
            "age": 20,
            "state": "Telangana",
        }
    )

    assert request.profile["annual_family_income"] == 180000
