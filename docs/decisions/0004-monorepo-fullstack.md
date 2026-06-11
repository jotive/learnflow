# ADR 0004 — Monorepo, full-stack, one compose up

**Status:** accepted

## Context

The deliverable should demonstrate a complete product, not an isolated API. It also has
to be trivial to run for a reviewer who just clones the repo.

## Decision

Keep backend and frontend in one repository (`backend/`, `frontend/`) with a single
`docker-compose.yml` at the root that brings up the whole stack —
`db` → `migrate` → `backend` → `frontend` — with `docker compose up`. The frontend is a
Next.js (App Router) app that consumes the API.

## Consequences

- One clone, one command, full product running — lowest friction to evaluate.
- Shared decision log and docs cover the whole system in one place.
- Backend and frontend still have independent toolchains and tests; the monorepo does
  not couple their builds.
- Deployment (out of scope for v1 local) would split naturally: backend to a container
  host, database to managed Postgres, frontend to a static/edge host.
