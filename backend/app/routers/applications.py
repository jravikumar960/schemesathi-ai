from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import ApplicationStatus, ApplicationTracking
from app.models.auth_session import AuthSession
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
)
from app.security.csrf import check_csrf, check_origin
from app.security.dependencies import get_current_session

router = APIRouter(prefix="/applications", tags=["applications"])


def _to_out(row: ApplicationTracking) -> ApplicationOut:
    return ApplicationOut(
        id=row.id,
        scheme_id=row.scheme_id,
        scheme_slug=row.scheme.slug,
        status=row.status,
        updated_at=row.updated_at,
    )


def _authorize_write(
    request: Request,
    current: tuple[AuthSession, User],
) -> User:
    check_origin(request)
    session, user = current
    check_csrf(request, session)
    return user


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(
    payload: ApplicationCreate,
    request: Request,
    current: tuple[AuthSession, User] = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    user = _authorize_write(request, current)

    scheme = db.scalar(
        select(Scheme).where(Scheme.slug == payload.scheme_slug)
    )
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")

    existing = db.scalar(
        select(ApplicationTracking).where(
            ApplicationTracking.user_id == user.id,
            ApplicationTracking.scheme_id == scheme.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Application already tracked",
        )

    row = ApplicationTracking(
        user_id=user.id,
        session_key=None,
        scheme_id=scheme.id,
        status=ApplicationStatus.NOT_STARTED,
    )
    db.add(row)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Application already tracked",
        )

    db.refresh(row)
    return _to_out(row)


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    current: tuple[AuthSession, User] = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> list[ApplicationOut]:
    _session, user = current

    rows = db.scalars(
        select(ApplicationTracking)
        .where(ApplicationTracking.user_id == user.id)
        .order_by(ApplicationTracking.id)
    ).all()

    return [_to_out(row) for row in rows]


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    payload: ApplicationStatusUpdate,
    request: Request,
    current: tuple[AuthSession, User] = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    user = _authorize_write(request, current)

    row = db.scalar(
        select(ApplicationTracking).where(
            ApplicationTracking.id == application_id,
            ApplicationTracking.user_id == user.id,
        )
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    row.status = payload.status
    db.commit()
    db.refresh(row)

    return _to_out(row)
