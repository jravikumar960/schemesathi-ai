import pytest
from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # Register all SQLAlchemy models
from app.database import Base, get_db
from app.main import create_app
from app.config import get_settings
from app.models.auth_session import AuthSession
from app.models.user import User
from app.security import rate_limit
from app.security.sessions import utcnow
from app.security.tokens import hash_token


PASSWORD = "StrongPassword123!"
EMAIL = "student@example.com"
BASE_URL = "https://localhost"


@pytest.fixture
def environment():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    factory = sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )

    application = create_app()

    def override_get_db():
        with factory() as db:
            yield db

    application.dependency_overrides[get_db] = override_get_db
    rate_limit.reset()

    # Do not use TestClient as a context manager here.
    # That would execute the production app lifespan/seeding.
    client = TestClient(application, base_url=BASE_URL)

    yield client, factory

    client.close()
    application.dependency_overrides.clear()
    rate_limit.reset()
    engine.dispose()


def register(client, email=EMAIL, password=PASSWORD):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )


def login(client, email=EMAIL, password=PASSWORD):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def csrf_headers(client):
    token = client.cookies.get("schemesathi_csrf")
    return {"X-CSRF-Token": token} if token else {}


def test_registration(environment):
    client, factory = environment

    response = register(client)

    assert response.status_code == 201
    assert response.json()["email"] == EMAIL
    assert "password_hash" not in response.text

    with factory() as db:
        user = db.scalar(select(User).where(User.email == EMAIL))
        assert user is not None
        assert user.password_hash != PASSWORD
        assert user.password_hash.startswith("$argon2")


def test_duplicate_registration(environment):
    client, _ = environment

    assert register(client).status_code == 201

    duplicate = register(client)

    assert duplicate.status_code == 400
    assert PASSWORD not in duplicate.text


def test_login_and_me(environment):
    client, factory = environment

    register(client)
    response = login(client)

    assert response.status_code == 200

    settings = get_settings()
    session_cookie = settings.session_cookie_name

    assert client.cookies.get(session_cookie)
    assert client.cookies.get("schemesathi_csrf")

    set_cookies = response.headers.get_list("set-cookie")
    session_header = next(
        value for value in set_cookies
        if value.startswith(session_cookie + "=")
    )

    assert "httponly" in session_header.lower()
    assert "secure" in session_header.lower()

    me = client.get("/api/auth/me")

    assert me.status_code == 200
    assert me.json()["email"] == EMAIL

    raw_token = client.cookies.get(session_cookie)

    with factory() as db:
        session = db.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == hash_token(raw_token)
            )
        )
        assert session is not None
        assert session.token_hash != raw_token


def test_invalid_login(environment):
    client, _ = environment

    register(client)

    response = login(client, password="WrongPassword123!")

    assert response.status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_unknown_user_login(environment):
    client, _ = environment

    response = login(client)

    assert response.status_code == 401


def test_logout_revokes_session(environment):
    client, _ = environment

    register(client)
    login(client)

    raw_token = client.cookies.get(
        get_settings().session_cookie_name
    )

    response = client.post(
        "/api/auth/logout",
        headers=csrf_headers(client),
    )

    assert response.status_code == 200
    assert client.get("/api/auth/me").status_code == 401

    # A revoked token must remain invalid even if replayed.
    client.cookies.set(
        get_settings().session_cookie_name,
        raw_token,
    )
    assert client.get("/api/auth/me").status_code == 401


def test_logout_requires_csrf(environment):
    client, _ = environment

    register(client)
    login(client)

    response = client.post("/api/auth/logout")

    assert response.status_code == 403
    assert client.get("/api/auth/me").status_code == 200


def test_logout_rejects_wrong_csrf(environment):
    client, _ = environment

    register(client)
    login(client)

    response = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-Token": "invalid-token"},
    )

    assert response.status_code == 403
    assert client.get("/api/auth/me").status_code == 200


def test_logout_rejects_wrong_origin(environment):
    client, _ = environment

    register(client)
    login(client)

    headers = csrf_headers(client)
    headers["Origin"] = "https://attacker.example"

    response = client.post(
        "/api/auth/logout",
        headers=headers,
    )

    assert response.status_code == 403
    assert client.get("/api/auth/me").status_code == 200


def test_expired_session(environment):
    client, factory = environment

    register(client)
    login(client)

    raw_token = client.cookies.get(
        get_settings().session_cookie_name
    )

    with factory() as db:
        session = db.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == hash_token(raw_token)
            )
        )
        session.expires_at = utcnow() - timedelta(minutes=1)
        db.commit()

    assert client.get("/api/auth/me").status_code == 401


def test_forged_session_token(environment):
    client, _ = environment

    client.cookies.set(
        get_settings().session_cookie_name,
        "forged-session-token",
    )

    assert client.get("/api/auth/me").status_code == 401


def test_two_users_have_separate_sessions(environment):
    client, _ = environment

    assert register(client, "a@example.com").status_code == 201
    assert register(client, "b@example.com").status_code == 201

    assert login(client, "a@example.com").status_code == 200
    token_a = client.cookies.get(
        get_settings().session_cookie_name
    )

    assert login(client, "b@example.com").status_code == 200
    token_b = client.cookies.get(
        get_settings().session_cookie_name
    )

    assert token_a != token_b

    assert client.get("/api/auth/me").json()["email"] == "b@example.com"

    # Clear User B's cookies before restoring User A's session.
    client.cookies.clear()

    client.cookies.set(
        get_settings().session_cookie_name,
        token_a,
    )

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "a@example.com"

