# holdmind/backend/tests/test_token_service.py
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from models.refresh_token import RefreshToken
from models.user import User
from services.token_service import (
    create_refresh_token,
    revoke_refresh_tokens,
    rotate_refresh_token,
)


def _make_user(db) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=f"{uuid.uuid4()}@example.com",
        hashed_password="hashed",
    )
    db.add(user)
    db.commit()
    return user


def test_create_refresh_token(db):
    user = _make_user(db)
    row = create_refresh_token(db, user.id)
    assert row.user_id == user.id
    assert len(row.token) == 64  # secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires = row.expires_at if row.expires_at.tzinfo else row.expires_at.replace(tzinfo=timezone.utc)
    assert expires > now + timedelta(days=29)
    assert expires < now + timedelta(days=31)


def test_rotate_refresh_token_valid(db):
    user = _make_user(db)
    original = create_refresh_token(db, user.id)
    old_token_str = original.token

    new_row = rotate_refresh_token(db, old_token_str)
    assert new_row is not None
    assert new_row.token != old_token_str
    assert new_row.user_id == user.id

    # Old row must be gone
    old = db.query(RefreshToken).filter(RefreshToken.token == old_token_str).first()
    assert old is None


def test_rotate_refresh_token_expired(db):
    user = _make_user(db)
    expired_row = RefreshToken(
        id=str(uuid.uuid4()),
        token=secrets.token_hex(32),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(expired_row)
    db.commit()

    result = rotate_refresh_token(db, expired_row.token)
    assert result is None

    # Expired row must be cleaned up
    leftover = db.query(RefreshToken).filter(RefreshToken.token == expired_row.token).first()
    assert leftover is None


def test_rotate_refresh_token_invalid(db):
    result = rotate_refresh_token(db, "nonexistent_token_string")
    assert result is None


def test_revoke_refresh_tokens(db):
    user = _make_user(db)
    create_refresh_token(db, user.id)
    create_refresh_token(db, user.id)

    rows_before = db.query(RefreshToken).filter(RefreshToken.user_id == user.id).count()
    assert rows_before == 2

    revoke_refresh_tokens(db, user.id)

    rows_after = db.query(RefreshToken).filter(RefreshToken.user_id == user.id).count()
    assert rows_after == 0
