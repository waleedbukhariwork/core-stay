# AGENTS

This repository is CodeCore. Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/ENGINEERING.md`, and `tasks/CURRENT.md` before making changes.

Follow the implemented architecture and current product scope. If code and documentation conflict, identify the discrepancy and reconcile it explicitly.

## Layout

- `apps/api` — NestJS modular monolith, organized by business capability.
- `apps/mobile` — Flutter for Android and iOS; managed by the Flutter toolchain, not pnpm.
- `infra/docker` — local development only.
- `docs/` — durable product, architecture, and engineering documentation.

## Backend Architecture

- Follow SOLID pragmatically. Architecture exists to control change.
- Organize by business capability. Keep comparable modules consistent without creating empty layers or unnecessary abstractions.
- Controllers handle HTTP input, validation, authenticated actor extraction, and response mapping.
- Application use cases/services own orchestration, resource authorization, and transaction boundaries.
- Domain code owns business invariants and state transitions. Keep it independent of NestJS, HTTP, Drizzle, and external SDKs.
- Infrastructure owns persistence and external-system adapters.
- Keep Drizzle queries, schemas, and database-specific types inside designated persistence/database boundaries. Do not expose them through application contracts, public module APIs, or Flutter-facing DTOs.
- Use focused repository contracts and query services where useful. Avoid universal generic repositories and pass-through classes.
- Reserve shared platform code for technical infrastructure. Business rules belong to their owning capabilities.

## Module Boundaries

- Each capability owns its business rules and writes.
- Communicate through explicit public module contracts. Private cross-module imports are prohibited.
- Keep dependencies acyclic. Correct ownership or orchestration instead of routinely introducing `forwardRef()`.
- Give cross-module workflows explicit ownership.
- Use designated query boundaries for cross-module reporting; avoid N+1 service calls.
- Follow the permanent backend rules in `docs/ENGINEERING.md`. Keep `architecture:check` aligned with the implemented boundaries; do not weaken it to accommodate violations.
- Keep the application a modular monolith. Do not introduce internal HTTP calls or distributed infrastructure solely for hypothetical microservice extraction.

## Authentication and Authorization

- Phase 2 authentication and users belong to the `identity` capability.
- Preserve established authentication, session, and token contracts unless an intentional change is authorized.
- Derive actor identity from verified credentials. Client-supplied user IDs, tenant IDs, or permissions are not proof of access.
- Enforce resource authorization at application boundaries so internal calls cannot bypass HTTP guards.
- Keep resource-specific access policies with the owning capability.
- Exclude credentials, tokens, secrets, and sensitive internal fields from responses and logs.

## API Compatibility and Data Safety

- Preserve existing endpoints, request/response structures, status codes, errors, validation behavior, and side effects unless an intentional contract change is authorized.
- Keep transport DTOs independent of database schemas. Validate untrusted input at runtime.
- Do not add global response wrappers or change Flutter-facing contracts as a side effect of refactoring.
- Make transaction ownership explicit. All writes in an atomic operation must use the same transaction.
- Preserve database constraints and concurrency guarantees. Use constraints and concurrency-safe operations for applicable invariants.
- Do not reset databases, rewrite applied migrations, or use destructive schema synchronization.
- Review necessary migrations for existing-data safety and deployment compatibility.
- Introduce durable events, outboxes, retries, or idempotency mechanisms only where required by actual workflows. Retries must be safe.

## Scope and Tooling

- Follow `tasks/CURRENT.md`. Do not add practice, AI, Redis, Terraform, or empty feature modules unless the scope is explicitly updated.
- Do not introduce Nx, Turborepo, or Melos.
- Do not scatter environment URLs or secrets. Use established configuration boundaries and validation.
- Preserve unrelated work. Avoid opportunistic dependency upgrades and unrelated refactors.
- Comments explain non-obvious reasoning, constraints, or tradeoffs.
- Update architecture and engineering documentation when intentionally changing boundaries or conventions.

## Quality

- API: run applicable format, lint, typecheck, test, build, and `architecture:check` checks.
- Flutter: run format, analyze, and tests when mobile code or shared API contracts are affected.
- Verify critical endpoint contracts, authorization boundaries, and relevant transaction/concurrency behavior.
- Use isolated PostgreSQL integration tests for database semantics that mocks cannot establish.
- Do not weaken tests or change expected contracts to hide regressions.
- Keep secrets out of git.
- Report checks actually executed, pre-existing failures, blocked verification, and incomplete work accurately.
