import hmac

from fastapi import HTTPException, Request

from app.config import get_settings
from app.models.auth_session import AuthSession
from app.security.tokens import hash_token

CSRF_COOKIE_NAME = "schemesathi_csrf"
CSRF_HEADER_NAME = "X-CSRF-Token"


def check_origin(request: Request) -> None:
    # Browsers send Origin on cross-site and state-changing requests. When it
    # is present it must be exactly the configured frontend origin.
    origin = request.headers.get("origin")
    if origin is not None and origin != get_settings().frontend_origin:
        raise HTTPException(status_code=403, detail="Origin not allowed")


def check_csrf(request: Request, session: AuthSession) -> None:
    # Double-submit check: the header must match the CSRF cookie, and its hash
    # must match the value stored with the session. Values are never logged.
    header = request.headers.get(CSRF_HEADER_NAME)
    cookie = request.cookies.get(CSRF_COOKIE_NAME)
    if not header or not cookie:
        raise HTTPException(status_code=403, detail="CSRF validation failed")
    if not hmac.compare_digest(header.encode(), cookie.encode()):
        raise HTTPException(status_code=403, detail="CSRF validation failed")
    if not hmac.compare_digest(
        hash_token(header).encode(), session.csrf_token_hash.encode()
    ):
        raise HTTPException(status_code=403, detail="CSRF validation failed")
