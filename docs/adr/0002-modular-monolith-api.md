# ADR-0002: Modular monolith API

## Status

Accepted

## Context

The backend will grow feature by feature. Premature microservices and generic base classes add cost without controlling change.

## Decision

Ship a NestJS modular monolith. Create a module when it has real behavior. Controllers, application services, and repositories stay distinct. Drizzle is a persistence detail.

## Consequences

Health is the only feature module in Phase 0. Auth/users/practice/AI wait for real work.
