from tests.test_api import client
from app.services.profile_extractor import extract_profile


def test_annual_income_extraction():
    profile = extract_profile(
        "BC/urban/1.8 lakh annual family income"
    )
    assert profile["category"] == "BC"
    assert profile["residence"] == "urban"
    assert profile["annual_family_income"] == 180000


def test_ambiguous_income_requires_clarification():
    profile = extract_profile("BC/urban/1.8 lakh income")
    assert profile["income_period_unknown"] == 180000
    assert "annual_family_income" not in profile


def test_chat_official_recommendation(client):
    response = client.post(
        "/api/chat",
        json={
            "message": (
                "I am a BC student from an urban area. "
                "My annual family income is 1.8 lakh."
            )
        },
    )

    assert response.status_code == 200, response.text

    # Telangana record is UNVERIFIED_PROGRAMME, so no verified recommendation is returned.
    data = response.json()
    assert data["recommendation"] is None

    response_text = data["response"].lower()
    disclaimer_text = str(data.get("disclaimer", "")).lower()
    assert "you are eligible" not in response_text
    assert "you are eligible" not in disclaimer_text


def test_chat_ambiguous_income(client):
    response = client.post(
        "/api/chat",
        json={"message": "BC/urban/1.8 lakh income"},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["recommendation"] is None
    assert "monthly or annual" in data["response"]


def test_chat_rejects_sensitive_identifiers(client):
    response = client.post(
        "/api/chat",
        json={
            "message": (
                "My Aadhaar number is 123456789012"
            )
        },
    )

    assert response.status_code == 422

