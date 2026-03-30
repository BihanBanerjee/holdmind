# holdmind/backend/tests/test_rate_limiting.py
from fastapi.testclient import TestClient


def test_signin_rate_limit(client: TestClient):
    """6th signin attempt in a minute returns 429."""
    payload = {"email": "x@example.com", "password": "wrongpassword"}
    responses = [client.post("/api/auth/signin", json=payload) for _ in range(6)]
    statuses = [r.status_code for r in responses]
    # First 5 are 401 (wrong credentials), 6th is 429
    assert statuses[:5] == [401, 401, 401, 401, 401]
    assert statuses[5] == 429


def test_signup_rate_limit(client: TestClient):
    """6th signup attempt in a minute returns 429."""
    responses = []
    for i in range(6):
        responses.append(client.post(
            "/api/auth/signup",
            json={"email": f"user{i}@example.com", "password": "password123"},
        ))
    statuses = [r.status_code for r in responses]
    # First 5 succeed (201) or conflict (400), 6th is 429
    assert all(s in (201, 400) for s in statuses[:5])
    assert statuses[5] == 429
