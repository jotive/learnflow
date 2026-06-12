# LearnFlow v1 — Design Spec

Consolidates the approved design. Source documents: [architecture](../../architecture.md),
[product-vision](../../product-vision.md), [api](../../api.md), ADRs 0001–0004.
This file adds the decisions resolved on 2026-06-11 and the coding conventions that
bind the implementation plan.

## Scope (approved)

Full-stack, no deadline-driven cuts:

- **Backend:** FastAPI · SQLAlchemy 2.0 · Pydantic v2 · PostgreSQL 16 · Alembic.
  Clean architecture, three layers (`domain` → `application` → `infrastructure`),
  dependencies point inward only (ADR 0001).
- **Frontend:** Next.js (App Router) consuming the API (ADR 0004).
- **All three PDF bonuses:** JWT auth, activity assignment, fake email notification.
- **Quality gates:** pytest ≥ 75% coverage with `pytest.ini`; flake8 + `.flake8`;
  black; isort; ruff.
- **Infra:** multistage Dockerfile, `docker-compose.yml` ordering
  `db` → `migrate` → `backend` → `frontend`; seed step provisions 1 leader + 2 members.

## Naming

Domain language stays LearnFlow: `LearningPath` / `Activity` (the PDF prescribes use
cases, not entity names). README maps every PDF requirement 1:1 to an endpoint so the
reviewer finds each case directly:

| PDF requirement | LearnFlow |
|---|---|
| CRUD task lists | CRUD `/paths` |
| CRUD tasks within a list | `POST/GET /paths/{id}/activities`, `PATCH/DELETE /activities/{id}` |
| Change task status | `PATCH /activities/{id}/status` |
| List tasks filtered by status/priority + completion % | `GET /paths/{id}/activities?status=&priority=` + `progress_percentage` |
| Bonus: JWT login | `POST /auth/login` + bearer-protected endpoints |
| Bonus: assign user to task | `POST /activities/{id}/assign` |
| Bonus: fake email notification | `Notifier` port, logging implementation |

## Coding conventions (binding)

1. **SOLID, made explicit by structure:**
   - SRP — one use case class per business action.
   - OCP — new behavior lands as new use cases / adapters, not edits to the domain.
   - LSP — any `*Repository` implementation (Postgres, in-memory) is substitutable;
     unit tests run the same use cases against in-memory implementations.
   - ISP — one port per aggregate (`UserRepository`, `LearningPathRepository`,
     `ActivityRepository`, `Notifier`), no catch-all repository.
   - DIP — application depends on `domain/ports.py` abstractions only; infrastructure
     injects concretes at the composition root (`main.py` / FastAPI dependencies).
2. **No docstrings, no inline comments.** Code must read on its own. Repo-level docs
   (README, ADRs, this spec) are the only documentation — the PDF requires them.
3. **Semantic naming.** Functions and methods read as the business rule they enforce;
   tests read as specifications of behavior.

## Out of scope (unchanged)

Certificates, AI skills mapping, auto-enrollment, HRIS integration, activity
prerequisites — documented direction only (product-vision roadmap).

## Acceptance

- `docker compose up` brings up the full product; backend on :8000 (`/docs`),
  frontend on :3000.
- `pytest` passes with ≥ 75% coverage.
- flake8 / black / isort / ruff clean.
- Every PDF use case demonstrable via the mapped endpoint.
