from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.routers import applications, health, schemes
from app.services.seed import seed_schemes_if_empty

# backend/app/main.py -> parents[2] is the project root
DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "schemes.json"


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_db()
    db = SessionLocal()
    try:
        seed_schemes_if_empty(db, DATA_FILE)
    finally:
        db.close()
    yield


app = FastAPI(title="SchemeSathi AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(schemes.router, prefix="/api")
app.include_router(applications.router, prefix="/api")

