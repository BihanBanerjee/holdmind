import base64
import os

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad


def encrypt_api_key(api_key: str, key: bytes) -> str:
    """Encrypt an API key using AES-256-CBC with a random IV."""
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct = cipher.encrypt(pad(api_key.encode("utf-8"), AES.block_size))
    return base64.b64encode(iv + ct).decode("utf-8")


def decrypt_api_key(encrypted: str, key: bytes) -> str:
    """Decrypt an AES-256-CBC encrypted API key."""
    raw = base64.b64decode(encrypted)
    iv, ct = raw[:16], raw[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(ct), AES.block_size).decode("utf-8")
