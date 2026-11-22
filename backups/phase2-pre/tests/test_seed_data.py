from pathlib import Path

from app.services.seed import load_scheme_file

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "schemes.json"


def test_dataset_contains_five_schemes():
    data = load_scheme_file(DATA_FILE)
    assert len(data.schemes) >= 5


def test_schemes_have_required_fields():
    data = load_scheme_file(DATA_FILE)

    for scheme in data.schemes:
        assert scheme.name.strip()
        assert scheme.slug.strip()
        assert scheme.description.strip()
        assert scheme.official_url.startswith("https://")
        if scheme.is_illustrative:
            assert scheme.eligibility_conditions
        else:
            assert scheme.verification_status == "VERIFIED"
            assert scheme.source_verified_on is not None
            assert scheme.official_url.startswith("https://")
        assert scheme.document_requirements
        assert scheme.application_steps


def test_scheme_slugs_are_unique():
    data = load_scheme_file(DATA_FILE)
    slugs = [scheme.slug for scheme in data.schemes]
    assert len(slugs) == len(set(slugs))


def test_unverified_schemes_are_clearly_illustrative():
    data = load_scheme_file(DATA_FILE)

    for scheme in data.schemes:
        if scheme.verification_status == "UNVERIFIED_ILLUSTRATIVE":
            assert scheme.is_illustrative is True
            assert scheme.application_deadline is None

