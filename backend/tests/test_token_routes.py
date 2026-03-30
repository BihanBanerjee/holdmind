# holdmind/backend/tests/test_token_routes.py
def test_refresh_missing_cookie(client):
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401


def test_refresh_invalid_token(client):
    client.cookies.set("hm_refresh", "bad_token_value")
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401


def test_refresh_valid(client):
    # Sign up to get a refresh cookie
    signup = client.post("/api/auth/signup", json={
        "email": "refresh@example.com",
        "password": "password123",
    })
    assert signup.status_code == 201
    assert "hm_refresh" in signup.cookies

    # Use the refresh cookie
    client.cookies.set("hm_refresh", signup.cookies["hm_refresh"])
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # New cookie must be set (token rotation)
    assert "hm_refresh" in resp.cookies
    assert resp.cookies["hm_refresh"] != signup.cookies["hm_refresh"]


def test_refresh_cookie_not_reusable(client):
    # Replay attack: using same refresh token twice must fail
    signup = client.post("/api/auth/signup", json={
        "email": "replay@example.com",
        "password": "password123",
    })
    original_cookie = signup.cookies["hm_refresh"]

    client.cookies.set("hm_refresh", original_cookie)
    first = client.post("/api/auth/refresh")
    assert first.status_code == 200

    # Try to reuse the original token
    client.cookies.set("hm_refresh", original_cookie)
    second = client.post("/api/auth/refresh")
    assert second.status_code == 401


def test_logout_revokes_token(client):
    signup = client.post("/api/auth/signup", json={
        "email": "logout@example.com",
        "password": "password123",
    })
    token = signup.json()["access_token"]
    refresh_cookie = signup.cookies["hm_refresh"]

    resp = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 204

    # Refresh token should now be invalid
    client.cookies.set("hm_refresh", refresh_cookie)
    refresh_resp = client.post("/api/auth/refresh")
    assert refresh_resp.status_code == 401


def test_logout_without_auth_fails(client):
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 401
