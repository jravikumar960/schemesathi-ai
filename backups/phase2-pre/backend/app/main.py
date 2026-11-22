from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import get_session_factory, init_db
from app.routers import applications, health, schemes
from app.routers import eligibility
from app.routers import agent
from app.routers import chat
from app.services.seed import seed_schemes_if_empty

DATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "schemes.json"
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_db()
    session_factory = get_session_factory()
    db = session_factory()
    try:
        seed_schemes_if_empty(db, DATA_FILE)
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="SchemeSathi AI API",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[get_settings().frontend_origin],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(
        health.router, prefix="/api"
    )
    application.include_router(
        schemes.router, prefix="/api"
    )
    application.include_router(
        applications.router, prefix="/api"
    )

    application.include_router(eligibility.router, prefix="/api")

    application.include_router(agent.router, prefix="/api")

    application.include_router(chat.router, prefix="/api")

    return application


app = create_app()