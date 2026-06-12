import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.domain.entities import User
from app.domain.roles import LEADER_ROLE, MEMBER_ROLE
from app.infrastructure.api.deps import get_session
from app.infrastructure.auth.security import BcryptPasswordHasher
from app.infrastructure.db.models import Base
from app.infrastructure.db.repositories import SqlAlchemyUserRepository
from app.infrastructure.settings import settings
from app.main import create_app

API = settings.api_prefix
LEADER_EMAIL = "leader@learnflow.dev"
MEMBER_EMAIL = "member@learnflow.dev"
PASSWORD = "demo-pass"


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture()
def seeded_users(session_factory):
    hasher = BcryptPasswordHasher(rounds=4)
    with session_factory() as session:
        users = SqlAlchemyUserRepository(session)
        leader = User(
            email=LEADER_EMAIL,
            name="Lia Leader",
            role=LEADER_ROLE,
            hashed_password=hasher.hash(PASSWORD),
        )
        member = User(
            email=MEMBER_EMAIL,
            name="Max Member",
            role=MEMBER_ROLE,
            hashed_password=hasher.hash(PASSWORD),
        )
        users.add(leader)
        users.add(member)
        session.commit()
    return leader, member


@pytest.fixture()
def client(session_factory, seeded_users):
    app = create_app()

    def override_session():
        session = session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_session
    return TestClient(app)


def auth_headers(client: TestClient, email: str) -> dict[str, str]:
    response = client.post(f"{API}/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def leader_headers(client):
    return auth_headers(client, LEADER_EMAIL)


@pytest.fixture()
def member_headers(client):
    return auth_headers(client, MEMBER_EMAIL)
