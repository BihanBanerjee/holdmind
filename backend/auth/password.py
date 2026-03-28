import hashlib
import os
import base64

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2."""
    # Use passlib's pbkdf2_sha256 which is always available
    from passlib.context import CryptContext
    ctx = CryptContext(
        schemes=["pbkdf2_sha256"],
        deprecated="auto"
    )
    return ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    from passlib.context import CryptContext
    ctx = CryptContext(
        schemes=["pbkdf2_sha256"],
        deprecated="auto"
    )
    return ctx.verify(plain, hashed)
