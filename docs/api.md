# API Reference

> **Status:** draft, tracks the agreed design. Endpoints may shift during implementation.

Base URL `…/` · JSON · JWT bearer auth except `login`.

## Auth & users

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | email + password → `{ access_token }` |
| GET | `/users/me` | any | current user profile |
| POST | `/users` | leader | provision a member account |

## Learning paths

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/paths` | leader | create a path |
| GET | `/paths` | any | list paths (leader: owned; member: assigned) |
| GET | `/paths/{id}` | any | path detail with `progress_percentage`, `is_compliant`, activities |
| PATCH | `/paths/{id}` | leader | edit title/description |
| DELETE | `/paths/{id}` | leader | delete a path |
| POST | `/paths/{id}/complete` | leader | sign off completion (guarded) |

## Activities

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/paths/{id}/activities` | leader | add an activity |
| GET | `/paths/{id}/activities` | any | list, filterable by `status` and `priority` |
| PATCH | `/activities/{id}` | leader | edit activity fields |
| PATCH | `/activities/{id}/status` | leader / assigned member | change status |
| POST | `/activities/{id}/assign` | leader | assign a member → triggers notification |
| DELETE | `/activities/{id}` | leader | delete an activity |

## Filters (test requirement)

`GET /paths/{id}/activities?status=IN_PROGRESS&priority=MANDATORY` — both optional,
combinable.

## Error mapping

| Domain exception | HTTP |
|---|---|
| `PermissionDeniedError` | 403 |
| `*NotFoundError` | 404 |
| `PathHasPendingMandatoryActivitiesError`, `PathHasNoActivitiesError` | 409 |
| validation (Pydantic) | 422 |
