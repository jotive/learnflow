# ADR 0001 — Clean / hexagonal architecture

**Status:** accepted

## Context

The system has real business rules (compliance gating, role permissions) that must be
testable in isolation from the web framework and the database. The brief also asks for
explicit Domain / Application / Infrastructure layers.

## Decision

Adopt clean architecture with dependencies pointing inward: domain depends on nothing,
application depends on domain through ports (abstract repositories + notifier),
infrastructure implements those ports and wires FastAPI. Use cases receive ports by
constructor injection.

## Consequences

- Domain rules are unit-tested against in-memory repositories, no DB or HTTP needed.
- Swapping persistence or the email channel touches only infrastructure.
- More upfront files/indirection than a router-with-ORM-calls approach — accepted as the
  cost of testability and clear boundaries.
