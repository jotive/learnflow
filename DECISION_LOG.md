# Decision Log

Technical decisions and their trade-offs. New decisions append as a numbered section.

---

## 1. Clean / hexagonal architecture

**Status:** accepted

### Context

The system has real business rules (compliance gating, role permissions) that must be
testable in isolation from the web framework and the database. The brief also asks for
explicit Domain / Application / Infrastructure layers.

### Decision

Adopt clean architecture with dependencies pointing inward: domain depends on nothing,
application depends on domain through ports (abstract repositories + notifier),
infrastructure implements those ports and wires FastAPI. Use cases receive ports by
constructor injection.

### Consequences

- Domain rules are unit-tested against in-memory repositories, no DB or HTTP needed.
- Swapping persistence or the email channel touches only infrastructure.
- More upfront files/indirection than a router-with-ORM-calls approach — accepted as the
  cost of testability and clear boundaries.

---

## 2. PostgreSQL + Alembic migrations as a service

**Status:** accepted

### Context

The system needs a real relational database (not SQLite-in-a-file) and a reproducible
way to create and evolve the schema. Schema creation via `Base.metadata.create_all()` is
convenient but leaves no migration history and drifts from production practice.

### Decision

Use PostgreSQL 16 as the database and Alembic as the schema owner. In Docker Compose the
schema is applied by a dedicated one-shot `migrate` service that runs `alembic upgrade
head` (and a seed step) and exits before the backend starts. Service order:
`db` (healthcheck) → `migrate` → `backend`.

### Consequences

- Schema changes are versioned, reviewable, and replayable on any environment.
- The backend container never runs migrations on boot — no race when scaling replicas.
- Slightly more moving parts locally (an extra service) than auto-create — accepted as
  the production-faithful choice.
- Integration tests run against in-memory SQLite created from the SQLAlchemy metadata —
  fast and dependency-free; Alembic owns the schema only for real (Postgres) environments.

---

## 3. Compliance is distinct from completion

**Status:** accepted

### Context

A naive learning-path tracker treats "done" as a single percentage. But the real job of
a corporate L&D leader is to guarantee that **mandatory** material is finished, while
optional material can be left undone. Modeling both as one number loses the distinction
the product exists to serve.

### Decision

Keep two independent task attributes instead of overloading one field:

- `priority` (`HIGH` | `MEDIUM` | `LOW`) — urgency; the dimension the list endpoint
  filters on alongside `status`.
- `is_mandatory` (bool) — whether the task must be finished for compliance.

The `LearningPath` exposes two derived properties, computed on read, never stored:

- `progress_percentage` = completed activities / total activities
- `is_compliant` = every `is_mandatory` activity is COMPLETED

Path sign-off (`POST /paths/{id}/complete`) is gated on **compliance**, not on
completion: blocked while any mandatory activity is pending
(`PathHasPendingMandatoryActivitiesError`); pending non-mandatory activities do not
block, regardless of priority.

### Consequences

- The core business rule is explicit, unit-testable, and visible in the API surface.
- Derived-on-read keeps the two values always consistent with activity state; no
  denormalized counters to keep in sync.
- A path can sit at 70% progress and still be 100% compliant — the intended behavior.

---

## 4. Monorepo, full-stack, one compose up

**Status:** accepted

### Context

The deliverable should demonstrate a complete product, not an isolated API. It also has
to be trivial to run for a reviewer who just clones the repo.

### Decision

Keep backend and frontend in one repository (`backend/`, `frontend/`) with a single
`docker-compose.yml` at the root that brings up the whole stack —
`db` → `migrate` → `backend` → `frontend` — with `docker compose up`. The frontend is a
Next.js (App Router) app that consumes the API.

### Consequences

- One clone, one command, full product running — lowest friction to evaluate.
- Shared decision log and docs cover the whole system in one place.
- Backend and frontend still have independent toolchains and tests; the monorepo does
  not couple their builds.
- Deployment (out of scope for v1 local) would split naturally: backend to a container
  host, database to managed Postgres, frontend to a static/edge host.
