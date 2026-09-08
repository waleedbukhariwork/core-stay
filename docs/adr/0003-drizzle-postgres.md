# ADR-0003: Drizzle 0.45 and PostgreSQL

## Status

Accepted

## Context

The product needs a SQL database and typed schema. Drizzle 1.0 is still prerelease.

## Decision

Use PostgreSQL with `drizzle-orm@0.45.x`, compatible `drizzle-kit@0.31.x`, and the `pg` driver. Schema is aggregated from feature files as tables appear.

## Consequences

No product tables in Phase 0. Migration tooling is configured so the first feature can add schema without a redesign. Connection lifecycle is owned by the database module.
