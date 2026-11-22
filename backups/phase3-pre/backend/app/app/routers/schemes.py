from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheme import Scheme
from app.schemas.scheme import SchemeOut

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("", response_model=list[SchemeOut])
def list_schemes(db: Session = Depends(get_db)) -> list[Scheme]:
    return list(db.scalars(select(Scheme).order_by(Scheme.id)).all())


@router.get("/{slug}", response_model=SchemeOut)
def get_scheme(slug: str, db: Session = Depends(get_db)) -> Scheme:
    scheme = db.scalar(select(Scheme).where(Scheme.slug == slug))
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme

