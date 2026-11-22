from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.scheme import Scheme
from app.schemas.scheme import SchemeFile


def load_scheme_file(path: str | Path) -> SchemeFile:
    raw = Path(path).read_text(encoding="utf-8-sig")
    return SchemeFile.model_validate_json(raw)


def seed_schemes_if_empty(db: Session, path: str | Path) -> int:
    from sqlalchemy import func

    count = db.scalar(select(func.count()).select_from(Scheme)) or 0

    if count:
        return 0

    return sync_schemes(db, path)["inserted"]


def sync_schemes(db: Session, path: str | Path) -> dict:
    """Insert or update schemes by slug without deleting other records."""

    scheme_file = load_scheme_file(path)

    slugs = [scheme.slug for scheme in scheme_file.schemes]
    if len(slugs) != len(set(slugs)):
        raise ValueError("Duplicate scheme slugs in dataset")

    inserted = 0
    updated = 0

    try:
        for seed in scheme_file.schemes:
            payload = seed.model_dump()
            payload["eligibility_conditions"] = [
                condition.model_dump(mode="json")
                for condition in seed.eligibility_conditions
            ]

            existing = db.scalar(
                select(Scheme).where(Scheme.slug == seed.slug)
            )

            if existing is None:
                db.add(Scheme(**payload))
                inserted += 1
            else:
                for field, value in payload.items():
                    setattr(existing, field, value)
                updated += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {"inserted": inserted, "updated": updated}
