# LearnFlow

Corporate learning-path tracker. Lets an L&D leader assign learning paths to team
members, enforce that **mandatory** activities get completed (compliance), and see
team progress in real time — without chasing anyone on spreadsheets.

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
- **Quality:** pytest · flake8 · ruff · black · isort
- **Infra (local):** Docker Compose (multistage Dockerfile) — `db` → `migrate` → `backend` → `frontend`

## Quickstart

```bash
docker compose up
# backend  → http://localhost:8000  (interactive API docs at /docs)
# frontend → http://localhost:3000
```

Seed data creates one leader and two members for the demo (credentials printed by the
seed step). The full endpoint reference is the OpenAPI schema served at
`http://localhost:8000/docs` — generated from the code, always current.

## Domain model

| Entity | Fields |
|---|---|
| **User** | id · email · name · role (LEADER \| MEMBER) · hashed_password · created_at |
| **LearningPath** | id · title · description · created_by · completed_at? · created_at |
| **Activity** | id · path_id · title · description? · priority (HIGH \| MEDIUM \| LOW) · is_mandatory (bool) · status (NOT_STARTED \| IN_PROGRESS \| COMPLETED) · assigned_to? · position · timestamps |

`LearningPath` exposes derived properties, computed on read and never stored:
`progress_percentage` (completed / total activities), `is_compliant` (every
`is_mandatory` activity is COMPLETED), and `activity_count`.

Two independent task attributes, not one overloaded field:

- `priority` — urgency; the dimension the list-activities endpoint filters on,
  alongside `status`.
- `is_mandatory` — whether the activity must be finished for the path to count as
  compliant. Independent of how urgent it is.

### Business invariants

1. **Compliance gating** — a leader signs off a path with `complete`. Blocked while any
   `is_mandatory` activity is pending → `PathHasPendingMandatoryActivitiesError`. Pending
   non-mandatory activities do **not** block, regardless of their priority.
2. **Role permissions** — a member may only change the status of activities assigned to
   them → `PermissionDeniedError`. A leader has full CRUD on paths/activities plus
   assignment and member provisioning.
3. **No empty path** — a path with zero activities cannot be signed off
   → `PathHasNoActivitiesError`.

Domain exceptions map to HTTP status codes (401 / 403 / 404 / 409) in one central handler.

## Architecture

Clean / hexagonal architecture. Three layers, dependencies point inward only.

```
infrastructure  ──▶  application  ──▶  domain
   (adapters)         (use cases)      (entities, rules, ports)
```

The **domain** depends on nothing. The **application** depends only on the domain
(through ports). The **infrastructure** depends on both and wires everything together.

### `app/domain` — the core, framework-free

- `entities.py` — `User`, `LearningPath`, `Activity` with the derived properties and
  the invariant checks.
- `enums.py` — `Role`, `Priority`, `ActivityStatus`.
- `exceptions.py` — domain errors (`PermissionDeniedError`,
  `PathHasPendingMandatoryActivitiesError`, `PathHasNoActivitiesError`, not-found errors).
- `ports.py` — abstract interfaces the application depends on: `UserRepository`,
  `LearningPathRepository`, `ActivityRepository`, `Notifier`.

No SQLAlchemy, no FastAPI, no I/O here.

### `app/application` — use cases

One use case per business action (`CreatePath`, `AssignActivity`,
`UpdateActivityStatus`, `CompletePath`, `ProvisionMember`, …). Each receives ports via
constructor injection, orchestrates domain objects, raises domain exceptions. DTOs in
`dtos.py` carry data in/out without leaking persistence or HTTP concerns.

### `app/infrastructure` — adapters

- `db/` — SQLAlchemy models, session, repository implementations of the domain ports.
- `api/` — FastAPI routers, request/response schemas, dependency wiring, the central
  exception handler that maps domain errors to HTTP status codes.
- `auth/` — JWT issue/verify, password hashing, `get_current_user`.
- `email/` — `Notifier` implementation (fake notification: logs the send).

`main.py` builds the FastAPI app and composes dependencies.

### Dependency rule, enforced

The application never imports infrastructure. Use cases talk to `ports`, and the API
layer injects concrete repositories at request time. Swapping Postgres for an in-memory
repository (as the unit tests do) requires no change to domain or application code.

### Key flows

**Assign activity → notify** — `POST /activities/{id}/assign` → `AssignActivity` use
case → repo update → `Notifier.send(assignment)` (fake email).

**Member completes an activity** — `PATCH /activities/{id}/status` →
`UpdateActivityStatus` → permission check (`assigned_to == current_user`) → persist.
Path `progress_percentage` / `is_compliant` are recomputed on the next read, not stored.

**Leader signs off a path** — `POST /paths/{id}/complete` → `CompletePath` → load path
+ activities → guard non-empty → guard all mandatory COMPLETED → set `completed_at`.
Optionals may remain open.

### Persistence and migrations

PostgreSQL 16 via SQLAlchemy 2.0. Schema is owned by **Alembic** migrations, applied by
a one-shot `migrate` service before the backend starts. A seed step inserts one leader
and two members for the demo.

## Tests

```bash
cd backend && pytest
```

Coverage target: 75%+. Unit tests cover domain rules and use cases against in-memory
repositories; integration tests hit the API through a test database.

## Decisions

Technical decisions and their trade-offs live in [DECISION_LOG.md](DECISION_LOG.md).

## Roadmap (not built — product direction)

Intentionally out of scope for v1, documented to show direction:

- **Certificates** issued on path completion (v1 renders a completion view client-side
  from completed-path state).
- **Skills mapping with AI** — infer and validate skills from activity completion.
- **Auto-enrollment** by department / role.
- **HRIS integration** — sync members and assignments from an HR system.
- **Prerequisites / forced ordering** between activities.
