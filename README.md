# LearnFlow

Corporate learning-path tracker. Lets an L&D leader assign learning paths to team
members, enforce that **mandatory** activities get completed (compliance), and see
team progress in real time — without chasing anyone on spreadsheets.

> **Status:** design phase. This README and `docs/` are drafts that track the agreed
> design. Code lands after the design is approved.

## Why it exists

Corporate L&D teams track who-completed-what in spreadsheets plus manual reminders.
No visibility, no enforcement of what is mandatory. LearnFlow makes the leader's core
question answerable in one screen: *"who finished the mandatory work, without me
chasing them?"*

The product distinction that drives the whole model: **compliance ≠ 100% complete**.
A path can be 70% done overall but 100% compliant if every *mandatory* activity is
finished and only *optional* ones remain.

## Roles

- **Leader** — designs paths, adds activities, assigns members, provisions member
  accounts, signs off path completion, monitors team progress.
- **Member** — sees assigned paths, advances their own activities, sees their progress.

## Stack

- **Backend:** Python · FastAPI · SQLAlchemy 2.0 · Pydantic v2 · PostgreSQL · Alembic
- **Frontend:** Next.js (App Router)
- **Infra (local):** Docker Compose — `db` → `migrate` → `backend` → `frontend`

## Quickstart

```bash
docker compose up
# backend  → http://localhost:8000  (docs at /docs)
# frontend → http://localhost:3000
```

Seed data creates one leader and two members for the demo (credentials printed by the
seed step).

## Documentation

- [docs/architecture.md](docs/architecture.md) — clean architecture, layers, dependency rules
- [docs/product-vision.md](docs/product-vision.md) — the problem, domain model, roadmap
- [docs/api.md](docs/api.md) — endpoint reference
- [DECISION_LOG.md](DECISION_LOG.md) — technical decisions and trade-offs

## Tests

```bash
cd backend && pytest
```

Coverage target: 75%+. Unit tests cover domain rules and use cases against in-memory
repositories; integration tests hit the API through a test database.
