import base64
import pytest
from auth.password import hash_password, verify_password
from auth.encryption import encrypt_api_key, decrypt_api_key
from auth.jwt import create_access_token, decode_token

TEST_KEY = base64.b64decode("dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTMyMzI=")  # 32 bytes

@pytest.fixture(autouse=True)
def setup_env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough")
    monkeypatch.setenv("ENCRYPTION_KEY", "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTMyMzI=")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")
    from config import get_settings
    get_settings.cache_clear()

# --- password ---
def test_hash_password_returns_hashed():
    hashed = hash_password("mysecret")
    assert hashed != "mysecret"
    assert len(hashed) > 20

def test_verify_password_correct():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True

def test_verify_password_wrong():
    hashed = hash_password("mysecret")
    assert verify_password("wrongpass", hashed) is False

# --- encryption ---
def test_encrypt_decrypt_roundtrip():
    original = "sk-or-v1-abc123"
    encrypted = encrypt_api_key(original, TEST_KEY)
    assert encrypted != original
    decrypted = decrypt_api_key(encrypted, TEST_KEY)
    assert decrypted == original

def test_encrypt_produces_different_ciphertext_each_time():
    key = TEST_KEY
    enc1 = encrypt_api_key("sk-or-v1-abc123", key)
    enc2 = encrypt_api_key("sk-or-v1-abc123", key)
    assert enc1 != enc2  # different IVs

# --- jwt ---
def test_create_and_decode_token():
    token = create_access_token("user-123")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"

def test_decode_invalid_token_raises():
    with pytest.raises(ValueError):
        decode_token("not.a.valid.token")
