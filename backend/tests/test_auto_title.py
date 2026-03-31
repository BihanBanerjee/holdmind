# backend/tests/test_auto_title.py
import pytest
from unittest.mock import MagicMock, patch
from services.conversation_service import auto_title_conversation
from models.conversation import Conversation
from models.chat_message import ChatMessage


def make_db(conv_title="New Chat", message_count=2):
    """Build a mock db session for auto_title tests."""
    db = MagicMock()
    conv = Conversation(id="c1", user_id="u1", title=conv_title)
    db.query.return_value.filter.return_value.first.return_value = conv
    # message count query
    count_query = MagicMock()
    count_query.filter.return_value.count.return_value = message_count
    # make second db.query() call return count_query
    db.query.side_effect = [
        # first call: get_conversation inner query (returns conv via chained .filter().first())
        MagicMock(**{"filter.return_value.first.return_value": conv}),
        # second call: count messages
        count_query,
    ]
    return db, conv


def test_auto_title_sets_title_on_first_exchange():
    db, conv = make_db(conv_title="New Chat", message_count=1)
    auto_title_conversation(db, "c1", "u1", "My name is Alex and I love hiking")
    assert conv.title == "My name is Alex and I love hiking"
    db.commit.assert_called_once()


def test_auto_title_truncates_to_50_chars():
    db, conv = make_db(conv_title="New Chat", message_count=1)
    long_msg = "A" * 80
    auto_title_conversation(db, "c1", "u1", long_msg)
    assert conv.title == "A" * 50


def test_auto_title_does_not_overwrite_custom_title():
    db, conv = make_db(conv_title="My Custom Title", message_count=2)
    auto_title_conversation(db, "c1", "u1", "Some message")
    assert conv.title == "My Custom Title"
    db.commit.assert_not_called()


def test_auto_title_skips_after_first_exchange():
    db, conv = make_db(conv_title="New Chat", message_count=4)
    auto_title_conversation(db, "c1", "u1", "Second message")
    assert conv.title == "New Chat"
    db.commit.assert_not_called()
