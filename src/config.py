"""Configuration settings from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/compliance_saas"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/compliance_saas"
    secret_key: str = "change-me-in-production"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    magic_link_expiry_minutes: int = 15
    training_gov_au_api_key: str = ""
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
