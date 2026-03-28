import base64

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jwt_secret_key: str
    encryption_key: str                       # base64-encoded 32-byte key
    database_url: str
    memory_db_dir: str = "/data/memories"
    qdrant_url: str
    qdrant_api_key: str
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def encryption_key_bytes(self) -> bytes:
        return base64.b64decode(self.encryption_key)


settings = Settings()
