from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./schemesathi.db"
    frontend_origin: str = "http://localhost:5173"
    session_cookie_name: str = "schemesathi_session"
    session_ttl_hours: int = 12
    session_cookie_secure: bool = True
    session_cookie_samesite: str = "lax"
    auth_rate_limit_attempts: int = 5
    auth_rate_limit_window_seconds: int = 900
    min_password_length: int = 12


@lru_cache
def get_settings() -> Settings:
    return Settings()
