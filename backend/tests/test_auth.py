# holdmind/backend/tests/test_auth.py
def test_signup_creates_user(client):
    resp = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"

def test_signup_duplicate_email_fails(client):
    client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    resp = client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    assert resp.status_code == 400

def test_signin_returns_token(client):
    client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    resp = client.post("/api/auth/signin", json={"email": "a@b.com", "password": "pass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_signin_wrong_password_fails(client):
    client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    resp = client.post("/api/auth/signin", json={"email": "a@b.com", "password": "wrong"})
    assert resp.status_code == 401

def test_me_returns_current_user(client):
    signup = client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    token = signup.json()["access_token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "a@b.com"

def test_me_without_token_fails(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_signup_sets_refresh_cookie(client):
    resp = client.post("/api/auth/signup", json={
        "email": "cookie@example.com",
        "password": "password123",
    })
    assert resp.status_code == 201
    assert "hm_refresh" in resp.cookies
    assert len(resp.cookies["hm_refresh"]) == 64  # secrets.token_hex(32)


def test_signin_sets_refresh_cookie(client):
    client.post("/api/auth/signup", json={"email": "c@b.com", "password": "pass123"})
    resp = client.post("/api/auth/signin", json={"email": "c@b.com", "password": "pass123"})
    assert resp.status_code == 200
    assert "hm_refresh" in resp.cookies
