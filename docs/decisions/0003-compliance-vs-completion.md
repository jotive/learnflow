# ADR 0003 — Compliance is distinct from completion

**Status:** accepted

## Context

A naive learning-path tracker treats "done" as a single percentage. But the real job of
a corporate L&D leader is to guarantee that **mandatory** material is finished, while
optional material can be left undone. Modeling both as one number loses the distinction
the product exists to serve.

## Decision

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

## Consequences

- The core business rule is explicit, unit-testable, and visible in the API surface.
- Derived-on-read keeps the two values always consistent with activity state; no
  denormalized counters to keep in sync.
- A path can sit at 70% progress and still be 100% compliant — the intended behavior.
