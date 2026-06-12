import os
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.domain.entities import User
from app.domain.roles import LEADER_ROLE
from app.infrastructure.auth.security import BcryptPasswordHasher
from app.infrastructure.db.repositories import SqlAlchemyUserRepository

postgres = pytest.importorskip("testcontainers.postgres")

BACKEND_DIR = Path(__file__).resolve().parents[2]
EXPECTED_TABLES = {"roles", "users", "learning_paths", "activities", "alembic_version"}


@pytest.fixture(scope="module")
def migrated_postgres_url():
    try:
        container = postgres.PostgresContainer("postgres:16-alpine", driver="psycopg")
        container.start()
    except Exception as exc:
        pytest.skip(f"Docker unavailable for Postgres integration tests: {exc}")
    url = container.get_connection_url()
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env={**os.environ, "DATABASE_URL": url},
        capture_output=True,
        text=True,
    )
    try:
        assert result.returncode == 0, result.stderr
        yield url
    finally:
        container.stop()


@pytest.mark.pg
def test_migrations_build_expected_schema(migrated_postgres_url):
    engine = create_engine(migrated_postgres_url)
    tables = set(inspect(engine).get_table_names())
    engine.dispose()
    assert EXPECTED_TABLES <= tables


@pytest.mark.pg
def test_user_round_trip_on_real_postgres(migrated_postgres_url):
    engine = create_engine(migrated_postgres_url)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    email = f"pg-probe-{uuid4().hex}@learnflow.dev"
    with session_factory() as session:
        SqlAlchemyUserRepository(session).add(
            User(
                email=email,
                name="Pg Probe",
                role=LEADER_ROLE,
                hashed_password=BcryptPasswordHasher(rounds=4).hash("demo-pass"),
            )
        )
        session.commit()
    with session_factory() as session:
        fetched = SqlAlchemyUserRepository(session).get_by_email(email)
    engine.dispose()
    assert fetched is not None
    assert fetched.email == email
    assert fetched.role.code == LEADER_ROLE.code
