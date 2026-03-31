import os
import pytest


def test_settings_loads_env_vars(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough")
    monkeypatch.setenv("ENCRYPTION_KEY", "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTMyMzI=")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")
    monkeypatch.setenv("MEMORY_DB_DIR", "/data/memories")

    from config import get_settings
    get_settings.cache_clear()
    s = get_settings()

    assert s.jwt_secret_key == "test-secret-key-that-is-long-enough"
    assert s.memory_db_dir == "/data/memories"


def test_encryption_key_bytes_returns_32_bytes(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough")
    monkeypatch.setenv("ENCRYPTION_KEY", "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTMyMzI=")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")

    from config import get_settings
    get_settings.cache_clear()
    s = get_settings()

    assert len(s.encryption_key_bytes) == 32


def test_encryption_key_validator_rejects_bad_base64(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough")
    monkeypatch.setenv("ENCRYPTION_KEY", "not-valid-base64!!!")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")

    from config import get_settings, Settings
    get_settings.cache_clear()

    with pytest.raises(Exception):
        Settings()


def test_encryption_key_validator_rejects_wrong_length(monkeypatch):
    # base64 of "shortkey" (8 bytes, not 32)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough")
    monkeypatch.setenv("ENCRYPTION_KEY", "c2hvcnRrZXk=")  # "shortkey" = 8 bytes
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")

    from config import get_settings, Settings
    get_settings.cache_clear()

    with pytest.raises(Exception, match="32 bytes"):
        Settings()
