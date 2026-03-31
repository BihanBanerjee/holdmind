# backend/tests/test_pattern_service.py
import pytest
from unittest.mock import MagicMock
from services.pattern_service import detect_patterns, format_patterns_for_prompt


def make_messages(contents: list[str]):
    messages = []
    for content in contents:
        m = MagicMock()
        m.content = content
        messages.append(m)
    return messages


def make_db_with_messages(messages):
    db = MagicMock()
    query_chain = (
        db.query.return_value
        .filter.return_value
        .filter.return_value
        .order_by.return_value
        .limit.return_value
    )
    query_chain.all.return_value = messages
    return db


def test_detect_concise_message_length():
    msgs = make_messages(["Hi", "Yes", "Ok", "Thanks", "Cool"] * 3)
    db = make_db_with_messages(msgs)
    result = detect_patterns(db, "u1")
    assert result["message_length"] == "concise"


def test_detect_detailed_message_length():
    long_msg = " ".join(["word"] * 60)
    msgs = make_messages([long_msg] * 5)
    db = make_db_with_messages(msgs)
    result = detect_patterns(db, "u1")
    assert result["message_length"] == "detailed"


def test_detect_high_technical_depth():
    msgs = make_messages([
        "How do I write a Python function?",
        "What is the best database schema for this API?",
        "Debug this SQL query for me",
        "How do I deploy with Docker?",
        "Explain async/await in JavaScript",
    ])
    db = make_db_with_messages(msgs)
    result = detect_patterns(db, "u1")
    assert result["technical_depth"] == "high"


def test_detect_casual_tone():
    msgs = make_messages([
        "hey thanks so much!",
        "awesome that works great",
        "yeah cool, lol",
        "ok thanks bye",
        "wow that's awesome",
    ])
    db = make_db_with_messages(msgs)
    result = detect_patterns(db, "u1")
    assert result["tone"] == "casual"


def test_returns_empty_dict_with_fewer_than_3_messages():
    db = make_db_with_messages(make_messages(["Hi", "Yes"]))
    result = detect_patterns(db, "u1")
    assert result == {}


def test_format_patterns_for_prompt_all_fields():
    patterns = {
        "message_length": "concise",
        "technical_depth": "high",
        "tone": "casual",
    }
    result = format_patterns_for_prompt(patterns)
    assert "concise" in result
    assert "technical" in result
    assert "casual" in result


def test_format_patterns_empty_returns_empty_string():
    assert format_patterns_for_prompt({}) == ""


def test_detect_formal_tone():
    msgs = make_messages([
        "I would appreciate your assistance regarding this matter.",
        "Please could you clarify the process for submitting a request?",
        "Therefore, I shall proceed with the proposed solution.",
        "Furthermore, I would like to inquire about the timeline.",
        "However, I appreciate your prompt response.",
    ])
    db = make_db_with_messages(msgs)
    result = detect_patterns(db, "u1")
    assert result["tone"] == "formal"


def test_get_user_patterns_returns_empty_on_malformed_json():
    db = MagicMock()
    user = MagicMock()
    user.patterns_json = "not valid json{{{"
    db.query.return_value.filter.return_value.first.return_value = user
    from services.pattern_service import get_user_patterns
    result = get_user_patterns(db, "u1")
    assert result == {}


def test_get_user_patterns_returns_empty_when_no_user():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    from services.pattern_service import get_user_patterns
    result = get_user_patterns(db, "u1")
    assert result == {}


def test_update_user_patterns_persists_json():
    msgs = make_messages(["Hi", "Yes", "Ok"] * 5)
    db_detect = make_db_with_messages(msgs)
    # For the user lookup after detect_patterns
    user = MagicMock()
    user.patterns_json = None
    # db_detect is used for detect_patterns; we need to also handle the User query
    # Make a separate mock that handles both query calls
    db = MagicMock()
    query_chain = (
        db.query.return_value
        .filter.return_value
        .filter.return_value
        .order_by.return_value
        .limit.return_value
    )
    query_chain.all.return_value = msgs
    db.query.return_value.filter.return_value.first.return_value = user
    from services.pattern_service import update_user_patterns
    update_user_patterns(db, "u1")
    assert user.patterns_json is not None
    import json
    data = json.loads(user.patterns_json)
    assert "message_length" in data
    db.commit.assert_called_once()
