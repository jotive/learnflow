from datetime import timedelta
from uuid import UUID

import jwt

from app.domain.entities import utcnow
from app.infrastructure.settings import settings

ALGORITHM = "HS256"


def issue_access_token(user_id: UUID) -> str:
    expires_at = utcnow() + timedelta(minutes=settings.jwt_expires_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_user_id(token: str) -> UUID | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
