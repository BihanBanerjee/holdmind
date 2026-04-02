# backend/tests/test_memory_service.py
from services.memory_service import make_short_id


def test_make_short_id_uses_first_three_words():
    result = make_short_id("sky is blue today", "abc123def")
    assert result == "sky-is-blue-abc1"


def test_make_short_id_strips_special_characters():
    result = make_short_id("sky has_color blue", "abc123def")
    assert result == "sky-has-color-abc1"


def test_make_short_id_handles_empty_label():
    result = make_short_id("", "abc123def")
    assert result == "memory-abc1"


def test_make_short_id_uses_four_char_uuid_suffix():
    result = make_short_id("test", "1234abcd")
    assert result == "test-1234"
