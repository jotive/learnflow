from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expires_minutes: int = 60
    api_prefix: str = "/api/v1"

    cors_origins: Annotated[list[str], NoDecode] = []
    cors_allow_credentials: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    resend_endpoint: str = "https://api.resend.com/emails"

    log_level: str = "INFO"
    log_json: bool = False
    log_file: str | None = None
    log_max_bytes: int = 5_000_000
    log_backup_count: int = 5

    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")


settings = Settings()
