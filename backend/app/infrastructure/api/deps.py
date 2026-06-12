from collections.abc import Generator
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.domain.entities import User
from app.infrastructure.api.errors import UnauthorizedError
from app.infrastructure.auth.jwt import decode_user_id
from app.infrastructure.auth.security import BcryptPasswordHasher
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyLearningPathRepository,
    SqlAlchemyUserRepository,
)
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.email.notifier import LoggingNotifier

bearer_scheme = HTTPBearer()


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_user_repository(session: Session = Depends(get_session)) -> SqlAlchemyUserRepository:
    return SqlAlchemyUserRepository(session)


def get_path_repository(
    session: Session = Depends(get_session),
) -> SqlAlchemyLearningPathRepository:
    return SqlAlchemyLearningPathRepository(session)


def get_activity_repository(
    session: Session = Depends(get_session),
) -> SqlAlchemyActivityRepository:
    return SqlAlchemyActivityRepository(session)


def get_password_hasher() -> BcryptPasswordHasher:
    return BcryptPasswordHasher()


def get_notifier() -> LoggingNotifier:
    return LoggingNotifier()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    users: SqlAlchemyUserRepository = Depends(get_user_repository),
) -> User:
    user_id = decode_user_id(credentials.credentials)
    if user_id is None:
        raise UnauthorizedError
    user = users.get_by_id(UUID(str(user_id)))
    if user is None or not user.is_active:
        raise UnauthorizedError
    return user
