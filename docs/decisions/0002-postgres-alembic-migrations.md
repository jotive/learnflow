# ADR 0002 — PostgreSQL + Alembic migrations as a service

**Status:** accepted

## Context

The system needs a real relational database (not SQLite-in-a-file) and a reproducible
way to create and evolve the schema. Schema creation via `Base.metadata.create_all()` is
convenient but leaves no migration history and drifts from production practice.

## Decision

Use PostgreSQL 16 as the database and Alembic as the schema owner. In Docker Compose the
schema is applied by a dedicated one-shot `migrate` service that runs `alembic upgrade
head` (and a seed step) and exits before the backend starts. Service order:
`db` (healthcheck) → `migrate` → `backend`.

## Consequences

- Schema changes are versioned, reviewable, and replayable on any environment.
- The backend container never runs migrations on boot — no race when scaling replicas.
- Slightly more moving parts locally (an extra service) than auto-create — accepted as
  the production-faithful choice.
- Tests use a separate test database with the same migrations.
