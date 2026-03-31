import base64
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    jwt_secret_key: str
    encryption_key: str                       # base64-encoded 32-byte key
    database_url: str
    memory_db_dir: str = "/data/memories"
    qdrant_url: str
    qdrant_api_key: str
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("encryption_key")
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        try:
            decoded = base64.b64decode(v)
        except Exception:
            raise ValueError("encryption_key must be valid base64")
        if len(decoded) != 32:
            raise ValueError(f"encryption_key must decode to 32 bytes, got {len(decoded)}")
        return v

    @property
    def encryption_key_bytes(self) -> bytes:
        return base64.b64decode(self.encryption_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
