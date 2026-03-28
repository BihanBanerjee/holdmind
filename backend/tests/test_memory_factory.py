# holdmind/backend/tests/test_memory_factory.py
import os
import pytest
from unittest.mock import patch, MagicMock


def test_get_user_store_creates_db_dir(tmp_path, monkeypatch):
    with patch("memory.factory.QdrantBackend") as mock_qdrant, \
         patch("memory.factory.OpenRouterProvider") as mock_provider, \
         patch("memory.factory.settings") as mock_settings:
        mock_settings.memory_db_dir = str(tmp_path / "memories")
        mock_settings.qdrant_url = "http://localhost:6333"
        mock_settings.qdrant_api_key = "test"
        mock_provider.return_value.embed = MagicMock(return_value=[0.1] * 1536)
        mock_qdrant.return_value = MagicMock()

        from memory.factory import get_user_store
        store = get_user_store("user-abc", "sk-or-test")

        db_path = tmp_path / "memories" / "user-abc.db"
        assert db_path.exists()


def test_get_user_store_uses_user_scoped_qdrant_collection(tmp_path, monkeypatch):
    with patch("memory.factory.QdrantBackend") as mock_qdrant, \
         patch("memory.factory.OpenRouterProvider") as mock_provider, \
         patch("memory.factory.settings") as mock_settings:
        mock_settings.memory_db_dir = str(tmp_path / "memories")
        mock_settings.qdrant_url = "http://localhost:6333"
        mock_settings.qdrant_api_key = "test"
        mock_provider.return_value.embed = MagicMock(return_value=[0.1] * 1536)
        mock_qdrant.return_value = MagicMock()

        from memory.factory import get_user_store
        get_user_store("user-xyz", "sk-or-test")

        call_kwargs = mock_qdrant.call_args[1]
        assert call_kwargs["collection_name"] == "beliefs_user-xyz"
