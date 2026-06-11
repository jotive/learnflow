# Product Vision

> **Status:** draft, tracks the agreed design. Updated as the design evolves.

## Problem

A corporate L&D leader needs to assign learning paths to their team, guarantee that
**mandatory** material gets completed (compliance), and see progress in real time.
Today that lives in spreadsheets plus manual reminders: no visibility, no enforcement.

## Actors and jobs

| Actor | Job-to-be-done |
|---|---|
| **Leader** | "Know who completed the mandatory work without chasing anyone." |
| **Member** | "See what I have to do and mark it done." |

## Domain model

| Entity | Fields |
|---|---|
| **User** | id · email · name · role (LEADER \| MEMBER) · hashed_password · created_at |
| **LearningPath** | id · title · description · created_by · completed_at? · created_at |
| **Activity** | id · path_id · title · description? · priority (MANDATORY \| OPTIONAL) · status (NOT_STARTED \| IN_PROGRESS \| COMPLETED) · assigned_to? · position · timestamps |

### Derived properties on LearningPath (computed on read)

- `progress_percentage` = completed activities / total activities
- `is_compliant` = every **MANDATORY** activity is COMPLETED
- `activity_count`

**Core distinction — compliance ≠ completion.** A path can be at 70% progress yet
100% compliant (all mandatory done, optionals skipped). This is what L&D actually
cares about and what separates the product from a generic to-do list.

## Business invariants

1. **Compliance gating** — a leader signs off a path with `complete`. Blocked while any
   mandatory activity is pending → `PathHasPendingMandatoryActivitiesError`. Pending
   *optional* activities do **not** block.
2. **Role permissions** — a member may only change the status of activities assigned to
   them → `PermissionDeniedError`. A leader has full CRUD on paths/activities plus
   assignment and member provisioning.
3. **No empty path** — a path with zero activities cannot be signed off
   → `PathHasNoActivitiesError`.

Domain exceptions map to HTTP status codes (403 / 404 / 409 / 422) in one central handler.

## Roadmap (not built — product direction)

These are intentionally **out of scope** for v1 and documented to show direction, not
to expand the build:

- **Certificates** issued on path completion (v1 renders a completion view client-side
  from completed-path state; no backend certificate feature).
- **Skills mapping with AI** — infer and validate skills from activity completion.
- **Auto-enrollment** by department / role.
- **HRIS integration** — sync members and assignments from an HR system.
- **Prerequisites / forced ordering** between activities.
