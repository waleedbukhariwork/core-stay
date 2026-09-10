# 0007 — Identity ownership and enforceable module boundaries

Status: accepted. Supersedes the Auth/Users ownership and facade arrangement in ADR 0006; retains its session, concurrency and delivery decisions.

## Context

Phase 2's Users facade was a pass-through account writer inside Auth's PostgreSQL workflows. Auth infrastructure imported Users persistence to share a connection, while auth application failures carried HTTP status codes and services handled cryptographic details. The HTTP guard constructed a plain principal; direct application callers could fabricate it, and logout lacked an explicit check of the referenced session's owner. This was an internal authorization gap, not evidence of an unauthenticated HTTP exploit.

## Decision

Consolidate these tightly related responsibilities into `identity`, which owns all five existing tables. Keep `health` as a minimal independent slice and move shared technical code from `common` to `platform`. Do not add unrelated capabilities or distributed infrastructure.

Separate HTTP adapters, application orchestration/resource policies, pure domain models/rules, and persistence/crypto/email/config infrastructure. Expose only `IdentityApi` for credential authentication and actor assertion. An immutable actor is registered with its verified credential expiry in the authenticator; the application asserts its provenance and resource ownership. Do not treat copied objects or queued claims as authority. No new permissions, tenants or service principals are introduced.

Application services own the unit of work. Focused repository implementations share exactly its transaction connection. Keep existing constraints, lock order, refresh rereads and commit-before-error behavior. Translate domain failures in module HTTP mappers composed into the generic Problem Details filter; retain the public API unchanged.

Keep synchronous bounded email delivery inside the current transaction as a deliberate compatibility exception. Reported delivery failure must still roll back registration/resend. SES acceptance followed by commit failure is not atomic, and lock duration includes delivery latency. A future durable outbox needs a reviewed behavior/operational change and duplicate/ordering handling.

Enforce imports and cycles using the existing TypeScript parser in a Vitest architecture check, including type imports/re-exports/dynamic imports and negative fixtures. No new dependency is needed. The Drizzle schema catalog and Nest composition roots are explicit exceptions, not permission for application code to access tables.

## Consequences and verification

Endpoint paths, DTO validation, token claims/algorithms, error structures, migrations and runtime integration selection are retained. Resource authorization now also applies to direct application calls. Logout's extra locked session read denies a mismatched signed actor/session pair; ordinary repeated logout and logout-all from an already revoked session retain their previous semantics while the access JWT remains valid.

PostgreSQL constraints/locks and the shared five-table transaction remain real coupling. Remote calls require service trust, fresh authentication, failure/idempotency/consistency design; ORM or service replacement is not automatic. The public actor handle is intentionally in-process and is not a transferable credential.

Health/platform migrated first and passed the existing tests, then Identity migrated against the same contracts. PostgreSQL regression tests cover ownership denial, direct actor forgery/expiry, rollback, concurrent operations, refresh query budget and one connection; route discovery detects duplicate/obsolete controllers. Final executed results and verification limits belong in [STATUS](../STATUS.md), permanent rules in [ENGINEERING](../ENGINEERING.md).
