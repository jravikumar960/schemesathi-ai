from app.services.agent import explain_node


def test_official_scheme_not_explained_twice():
    state = {
        "results": [
            {
                "scheme_slug": "telangana-post-matric-scholarships",
                "scheme_name": "Telangana Post-Matric Scholarships",
                "status": "NEEDS_INFORMATION",
                "is_illustrative": False,
            }
        ],
        "post_matric_income": {
            "status": "NEEDS_INFORMATION",
            "reason": "Valid annual family income is required.",
        },
    }

    response = explain_node(state)["response"]

    assert "income check: NEEDS_INFORMATION" in response
    assert "Valid annual family income is required." in response
    assert "Telangana Post-Matric Scholarships: NEEDS_INFORMATION" not in response
    assert "not an official scholarship eligibility decision" in response


def test_income_pass_remains_preliminary():
    state = {
        "results": [],
        "post_matric_income": {
            "status": "PASS",
            "reason": "Income is within the category-specific limit.",
        },
    }

    response = explain_node(state)["response"]

    assert "income check: PASS" in response
    assert "preliminary assessment" in response.lower()
