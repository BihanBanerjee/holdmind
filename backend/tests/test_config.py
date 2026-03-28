import importlib
import sys


def test_settings_loads_env_vars(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough-32ch")
    monkeypatch.setenv("ENCRYPTION_KEY", "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleQ==")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")

    # Remove cached module if already imported
    for mod in list(sys.modules.keys()):
        if mod == "config" or mod.startswith("config."):
            del sys.modules[mod]

    import config
    importlib.reload(config)

    assert config.settings.jwt_secret_key == "test-secret-key-that-is-long-enough-32ch"
    assert config.settings.memory_db_dir == "/data/memories"
    assert config.settings.database_url == "sqlite:///./test.db"


def test_encryption_key_bytes_returns_32_bytes(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough-32ch")
    monkeypatch.setenv("ENCRYPTION_KEY", "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTMyMzI=")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")

    for mod in list(sys.modules.keys()):
        if mod == "config" or mod.startswith("config."):
            del sys.modules[mod]

    import config
    importlib.reload(config)

    key_bytes = config.settings.encryption_key_bytes
    assert len(key_bytes) == 32
