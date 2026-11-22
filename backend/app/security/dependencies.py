from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.auth_session import AuthSession
from app.models.user import User
from app.security.sessions import get_valid_session


def get_current_session(
    request: Request, db: Session = Depends(get_db)
) -> tuple[AuthSession, User]:
    # Errors never include the token, and the token is never logged.
    raw_token = request.cookies.get(get_settings().session_cookie_name)
    session = get_valid_session(db, raw_token) if raw_token else None
    if session is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return session, user
