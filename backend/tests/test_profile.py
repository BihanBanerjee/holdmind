# backend/tests/test_profile.py
import pytest


def register_and_login(client):
    client.post("/api/auth/signup", json={"email": "user@test.com", "password": "password123"})
    r = client.post("/api/auth/signin", json={"email": "user@test.com", "password": "password123"})
    return r.json()["access_token"]


def test_patch_me_sets_display_name(client):
    token = register_and_login(client)
    r = client.patch(
        "/api/auth/me",
        json={"display_name": "Alice"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["display_name"] == "Alice"


def test_patch_me_trims_display_name(client):
    token = register_and_login(client)
    r = client.patch(
        "/api/auth/me",
        json={"display_name": "  Bob  "},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["display_name"] == "Bob"


def test_patch_me_clears_display_name_with_empty_string(client):
    token = register_and_login(client)
    client.patch("/api/auth/me", json={"display_name": "Alice"}, headers={"Authorization": f"Bearer {token}"})
    r = client.patch("/api/auth/me", json={"display_name": ""}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["display_name"] is None


def test_patch_me_no_change_when_null(client):
    token = register_and_login(client)
    client.patch("/api/auth/me", json={"display_name": "Alice"}, headers={"Authorization": f"Bearer {token}"})
    r = client.patch("/api/auth/me", json={}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    # Passing no fields leaves display_name unchanged
    assert r.json()["display_name"] == "Alice"


def test_get_me_returns_display_name(client):
    token = register_and_login(client)
    client.patch("/api/auth/me", json={"display_name": "Carol"}, headers={"Authorization": f"Bearer {token}"})
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["display_name"] == "Carol"


def test_patch_me_requires_auth(client):
    r = client.patch("/api/auth/me", json={"display_name": "Nobody"})
    assert r.status_code == 401
