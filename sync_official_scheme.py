from pathlib import Path
from sqlalchemy import select

from app.database import get_session_factory
from app.models.scheme import Scheme
from app.services.seed import load_scheme_file

source = Path("data/schemes.json")
dataset = load_scheme_file(source)

slug = "telangana-post-matric-scholarships"
record = next((s for s in dataset.schemes if s.slug == slug), None)

if record is None:
    raise RuntimeError("Official scheme record not found")

SessionLocal = get_session_factory()

with SessionLocal() as db:
    existing = db.scalar(
        select(Scheme).where(Scheme.slug == slug)
    )

    values = record.model_dump()
    values["eligibility_conditions"] = [
        c.model_dump(mode="json")
        for c in record.eligibility_conditions
    ]

    if existing is None:
        db.add(Scheme(**values))
        action = "Inserted"
    else:
        for key, value in values.items():
            setattr(existing, key, value)
        action = "Updated"

    db.commit()

print(f"{action} official scholarship record.")
print("Existing demo schemes and tracking records preserved.")
