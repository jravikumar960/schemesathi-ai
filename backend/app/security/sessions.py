from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.auth_session import AuthSession
from app.models.user import User
from app.security.tokens import hash_token, new_csrf_token, new_session_token


def utcnow() -> datetime:
    # Naive UTC, matching how SQLite round-trips the timezone-aware columns.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_session(db: Session, user: User) -> tuple[str, str]:
    """Create a session row. Returns (raw_session_token, raw_csrf_token).

    Only the SHA-256 hashes of the tokens are stored.
    """
    raw_token = new_session_token()
    raw_csrf = new_csrf_token()
    now = utcnow()
    row = AuthSession(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        csrf_token_hash=hash_token(raw_csrf),
        created_at=now,
        expires_at=now + timedelta(hours=get_settings().session_ttl_hours),
    )
    db.add(row)
    db.commit()
    return raw_token, raw_csrf


def get_valid_session(db: Session, raw_token: str) -> AuthSession | None:
    """Return the live session for a raw token, or None.

    Live means: token hash matches, not revoked, not expired, and the owning
    user is active.
    """
    if not raw_token:
        return None
    now = utcnow()
    return db.scalar(
        select(AuthSession)
        .join(User, User.id == AuthSession.user_id)
        .where(
            AuthSession.token_hash == hash_token(raw_token),
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
            User.is_active.is_(True),
        )
    )


def revoke_session(db: Session, session: AuthSession) -> None:
    # Rows are never deleted; revocation is recorded by timestamp.
    session.revoked_at = utcnow()
    db.commit()
