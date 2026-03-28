# holdmind/backend/tests/test_models.py
import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from database import Base
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
