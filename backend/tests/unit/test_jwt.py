from uuid import uuid4

from app.infrastructure.auth.jwt import decode_user_id, issue_access_token


def test_issue_and_decode_roundtrip():
    user_id = uuid4()
    token = issue_access_token(user_id)
    assert decode_user_id(token) == user_id


def test_decode_rejects_garbage_token():
    assert decode_user_id("not-a-jwt") is None


def test_decode_rejects_token_signed_with_other_secret():
    import jwt

    forged = jwt.encode({"sub": str(uuid4())}, "another-secret", algorithm="HS256")
    assert decode_user_id(forged) is None
