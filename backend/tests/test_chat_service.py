# holdmind/backend/tests/test_chat_service.py
from unittest.mock import MagicMock, patch
from recollectx.claims import SemanticClaim, EpisodicClaim


def make_mock_store(claims=None):
    store = MagicMock()
    store.semantic_query.return_value = claims or []
    return store


def test_build_system_prompt_no_memories():
    from services.chat_service import build_system_prompt
    prompt = build_system_prompt([])
    assert "Holdmind" in prompt
    assert "remember" not in prompt.lower()


def test_build_system_prompt_with_memories():
    from services.chat_service import build_system_prompt
    claims = [
        SemanticClaim(subject="user", predicate="likes", object="pizza", confidence=0.9),
        EpisodicClaim(summary="User is learning Python", confidence=0.8),
    ]
    prompt = build_system_prompt(claims)
    assert "pizza" in prompt
    assert "Python" in prompt


def test_claim_to_text_semantic():
    from services.chat_service import claim_to_text
    claim = SemanticClaim(subject="user", predicate="likes", object="coffee", confidence=0.9)
    text = claim_to_text(claim)
    assert "user" in text
    assert "coffee" in text


def test_claim_to_text_episodic():
    from services.chat_service import claim_to_text
    claim = EpisodicClaim(summary="User visited Paris", confidence=0.8)
    text = claim_to_text(claim)
    assert "Paris" in text


def test_extract_and_store_calls_extractor_and_updater():
    from services.chat_service import extract_and_store

    mock_store = make_mock_store()
    mock_extractor = MagicMock()
    mock_updater = MagicMock()

    claim = SemanticClaim(subject="user", predicate="likes", object="tea", confidence=0.9)
    mock_extractor.extract.return_value = [claim]

    with patch("services.chat_service.get_user_store", return_value=mock_store), \
         patch("services.chat_service.get_extractor", return_value=mock_extractor), \
         patch("services.chat_service.get_updater", return_value=mock_updater):

        result = extract_and_store(
            user_message="I love tea",
            ai_response="Tea is great!",
            user_id="user-1",
            api_key="sk-or-test",
        )

    mock_extractor.extract.assert_called_once()
    mock_updater.process.assert_called_once_with(claim)
    assert len(result) == 1
    assert result[0]["type"] == "semantic"
