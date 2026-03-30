# holdmind/backend/tests/test_models.py
import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from base import Base
import models  # noqa


@pytest.fixture
def engine():
    e = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=e)
    yield e
    Base.metadata.drop_all(bind=e)


def test_tables_exist(engine):
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "conversations" in tables
    assert "chat_messages" in tables


def test_user_has_expected_columns(engine):
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("users")}
    assert {"id", "email", "hashed_password", "openrouter_key_enc", "created_at"} <= cols


def test_conversation_has_user_fk(engine):
    inspector = inspect(engine)
    fks = inspector.get_foreign_keys("conversations")
    fk_tables = {fk["referred_table"] for fk in fks}
    assert "users" in fk_tables


def test_chat_message_has_conversation_fk(engine):
    inspector = inspect(engine)
    fks = inspector.get_foreign_keys("chat_messages")
    fk_tables = {fk["referred_table"] for fk in fks}
    assert "conversations" in fk_tables


def test_refresh_token_model(db):
    from models.refresh_token import RefreshToken
    import secrets, uuid
    from datetime import datetime, timedelta, timezone
    row = RefreshToken(
        id=str(uuid.uuid4()),
        token=secrets.token_hex(32),
        user_id="user-123",
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(row)
    db.commit()
    fetched = db.query(RefreshToken).filter(RefreshToken.token == row.token).first()
    assert fetched is not None
    assert fetched.user_id == "user-123"
