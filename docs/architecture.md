# Architecture

> **Status:** draft, tracks the agreed design.

Clean / hexagonal architecture. Three layers, dependencies point inward only.

```
infrastructure  ──▶  application  ──▶  domain
   (adapters)         (use cases)      (entities, rules, ports)
```

The **domain** depends on nothing. The **application** depends only on the domain
(through ports). The **infrastructure** depends on both and wires everything together.

## Layers

### `app/domain` — the core, framework-free

- `entities.py` — `User`, `LearningPath`, `Activity` as Pydantic models with the
  derived properties (`progress_percentage`, `is_compliant`, `activity_count`) and the
  invariant checks.
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
- `email/` — `Notifier` implementation (fake notification: logs + records the send).

`main.py` builds the FastAPI app and composes dependencies.

## Dependency rule, enforced

The application never imports infrastructure. Use cases talk to `ports`, and the API
layer injects concrete repositories at request time. Swapping Postgres for an in-memory
repository (as the unit tests do) requires no change to domain or application code.

## Key flows

**Assign activity → notify**
`POST /activities/{id}/assign` → `AssignActivity` use case → repo update →
`Notifier.send(assignment)` (fake email). One transaction, notification after commit.

**Member completes an activity**
`PATCH /activities/{id}/status` → `UpdateActivityStatus` → permission check
(`assigned_to == current_user`) → persist. Path `progress_percentage` /
`is_compliant` are recomputed on the next read, not stored.

**Leader signs off a path**
`POST /paths/{id}/complete` → `CompletePath` → load path + activities → guard non-empty
→ guard all mandatory COMPLETED → set `completed_at`. Optionals may remain open.

## Persistence and migrations

PostgreSQL 16 via SQLAlchemy 2.0. Schema is owned by **Alembic** migrations, applied by
a one-shot `migrate` service before the backend starts. A seed step inserts one leader
and two members for the demo.
