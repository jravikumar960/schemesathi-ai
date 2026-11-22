from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import ApplicationStatus, ApplicationTracking
from app.models.scheme import Scheme
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def _to_out(row: ApplicationTracking) -> ApplicationOut:
    return ApplicationOut(
        id=row.id,
        session_key=row.session_key,
        scheme_id=row.scheme_id,
        scheme_slug=row.scheme.slug,
        status=row.status,
        updated_at=row.updated_at,
    )


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(
    payload: ApplicationCreate, db: Session = Depends(get_db)
) -> ApplicationOut:
    scheme = db.scalar(select(Scheme).where(Scheme.slug == payload.scheme_slug))
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")

    existing = db.scalar(
        select(ApplicationTracking).where(
            ApplicationTracking.session_key == payload.session_key,
            ApplicationTracking.scheme_id == scheme.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Application already tracked")

    row = ApplicationTracking(
        session_key=payload.session_key,
        scheme_id=scheme.id,
        status=ApplicationStatus.NOT_STARTED,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Application already tracked")
    db.refresh(row)
    return _to_out(row)


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    session_key: str = Query(..., min_length=1, max_length=64),
    db: Session = Depends(get_db),
) -> list[ApplicationOut]:
    rows = db.scalars(
        select(ApplicationTracking)
        .where(ApplicationTracking.session_key == session_key)
        .order_by(ApplicationTracking.id)
    ).all()
    return [_to_out(row) for row in rows]


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    payload: ApplicationStatusUpdate,
    session_key: str = Query(..., min_length=1, max_length=64),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    row = db.scalar(
        select(ApplicationTracking).where(
            ApplicationTracking.id == application_id,
            ApplicationTracking.session_key == session_key,
        )
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return _to_out(row)


