# 0008 — Lightweight layers within capabilities

Status: accepted. Refines the internal layout in ADR 0007; retains its capability ownership, authorization and transaction decisions.

## Context

The capability boundaries were coherent, but HTTP code used inconsistent conventions: Identity separated DTOs and response mapping, Profile combined request/response definitions and embedded mapping in its controller, and Health combined its DTO with response construction. Health also had a service that only forwarded a probe call. Profile update types accepted null although runtime rules rejected it, while response types lost known catalog keys and next-step values.

## Decision

Keep the capability-first modular monolith and existing layer names. Standardize HTTP DTOs under `transport/http/dto/`, response construction in response mappers, and failure translation in error mappers. Keep related classes together when they share a responsibility; do not require one file per DTO or one class per operation.

Keep Profile's cohesive application service, focused repository contract, pure domain functions and atomic Drizzle upsert. Define non-null optional update fields separately from nullable persisted state, explicit application return contracts, and precise public catalog/next-step shapes. No new response fields or accepted request values are introduced.

Remove Health's forwarding service and have its controller invoke the application-owned probe contract, bound to the database adapter by Nest. This uses the existing allowed transport-to-application dependency; no architecture-check exception or relaxation is needed. Preserve controller HTTP tests and move its small unit checks to the controller.

Retain Identity's services, focused transaction repositories and public actor API. Other capabilities must authenticate through Identity and authorize at their application boundaries. The WeakMap actor handle requires the original immutable object issued by the authenticator instance; copying or serializing its fields does not transfer authentication. Future workers must authenticate an explicit execution identity.

## Authorization and operational review

Active/verified authorization currently locks user then session within an Identity transaction. Profile's persistence statement follows that transaction, so already-authorized requests can complete while logout races them. Locks also impose contention on concurrent operations for the same account, including catalog reads. Retain these semantics in this structural cleanup; replacing the lock strategy requires a separate consistency design and PostgreSQL concurrency validation, not a folder move. No load-performance claim is made.

Synchronous verification email still occurs within authentication transactions to preserve delivery-failure rollback. The associated lock duration and email/commit uncertainty remain documented tradeoffs. No queue, outbox, generic repository, command bus or extra public facade is introduced.

## Consequences and verification

DTO location and mapping are predictable across capabilities while layer depth follows actual behavior. Domain/application code remains independent of HTTP DTOs and database implementations. Explicit mapping preserves response allowlists; type annotations alone provide no runtime serialization guarantee.

Paths, payloads, envelopes, headers, validation errors, session contracts, SQL schemas/migrations and external integrations are preserved. Existing import/cycle rules remain enforced, with a positive fixture for a controller invoking an application port. Profile HTTP regression checks cover moved validation/mapping and application denial before persistence; real Identity/PostgreSQL tests cover the retained authentication and transaction implementation. Executed checks and limitations are recorded in `docs/STATUS.md`.
