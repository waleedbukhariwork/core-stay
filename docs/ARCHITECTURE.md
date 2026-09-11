# Architecture

CodeCore is a deployment-independent modular monolith: one NestJS API and one Flutter app. Application code does not assume a specific host; email delivery has an SES infrastructure adapter.

## Backend ownership

| Capability | Owns | Exposes |
| --- | --- | --- |
| `identity` | Accounts, password credentials, email verification, authentication and sessions; all five existing tables and their writes | `IdentityApi`: authenticate access credentials, assert actor provenance/expiry, and validate an active verified account/live session; existing `/auth/*` HTTP contracts |
| `profile` | Engineering preferences, selectable catalog, setup completion and resume state; `engineering_profiles` and its writes | Authenticated `/profile` read/update and `/profile/catalog` HTTP contracts |
| `health` | Connectivity probe and its HTTP response | Existing `/health` endpoint; no business API |
| `platform` | Validated configuration, PostgreSQL pool/Drizzle composition, logging, HTTP validation and Problem Details | Technical facilities, no business policy |

The former Auth and Users implementation is consolidated into Identity. Users had no independent capability beyond the same account lifecycle, and its facade/persistence split crossed the atomic auth workflows. Table names and SQL migrations remain unchanged. See [ADR 0007](adr/0007-identity-modular-boundaries.md).

```text
apps/api/src/
  main.ts, app.module.ts                 # process and module composition
  platform/
    config/, database/, logging/, http/
  modules/
    identity/
      identity.module.ts                # providers; exports only IdentityApi
      public/identity.api.ts            # plain actor and deliberate capability
      transport/http/                   # controllers, guards, DTOs, response/error mapping
      application/                      # registration/login, verification, session use cases
        policies/                       # verified actor and resource ownership
        ports/                          # unit of work, focused repositories, clock, token/code/email adapters
      domain/                           # account/challenge/session models, invariants, failures
      infrastructure/
        persistence/                    # schemas, Drizzle repositories and transaction implementation
        crypto/, email/, config/        # configured adapters; actual system clock
    profile/
      profile.module.ts                 # composes Identity through its public API
      transport/http/                   # guard, class-validator DTOs, explicit mapping
      application/                      # profile operations and focused repository port
      domain/                           # authoritative catalog, validation and progress
      infrastructure/persistence/       # atomic partial upsert and profile schema
    health/
      health.module.ts
      application/                      # probe contract and use case
      infrastructure/persistence/       # PostgreSQL probe
      transport/http/                   # explicit response and failure mapping
apps/api/drizzle/                        # established migration path, unchanged
```

Health stays small: it has no artificial domain, public facade, or transaction coordinator. There are no placeholder modules, workflows, background jobs, events or internal HTTP services.

## Dependencies and contracts

Transport invokes application behavior and maps plain results to explicit response DTOs. Application coordinates domain policies and calls ports implemented by infrastructure. Domain imports only its own domain code. Nest DI is allowed in application and infrastructure; HTTP and ORM types are not application contracts. Application services remain cohesive use cases rather than one class per method. A validated scalar input does not need an extra pass-through input class.

Other modules may import only a capability's `public/` contract; module composition may import another module's Nest module. `IdentityApi` does not expose repositories, transaction connections, database rows or private services. Public types are plain and do not re-export private models. Resource policies belong to the resource owner, not a central identity permission service.

`pnpm --filter @codecore/api architecture:check` parses production TypeScript imports, type imports, re-exports, literal dynamic imports and require calls, resolves TypeScript paths, and rejects private cross-module access, outward layer dependencies, misplaced database access and source/module cycles. Nonliteral module loading is rejected. Tests may directly exercise private implementations. The same check runs in the regular test suite and CI; it is a source dependency guard, not a substitute for reviewing runtime DI or arbitrary reflection.

Composition exceptions are narrow: root `AppModule` wires module HTTP error mappers into the generic platform filter, and `platform/database/schema.ts` aggregates module-owned persistence schemas for Drizzle. Platform cannot otherwise import business implementations. Infrastructure does not depend on HTTP errors; domain/application failures are translated only in transport, preserving every established code/status, including fifth-guess 400 versus already-locked 429.

## Atomic operations and authorization

Application services delimit `IdentityUnitOfWork.transaction`. Its scoped account, credential, challenge, session and refresh-token repositories all receive the same Drizzle transaction connection. They never fall back to the global pool. Registration creates account/credential/challenge together; verification consumes the challenge, verifies the account and creates a session together; refresh consumes/replaces the token and updates the session together. A thrown failure rolls back; incorrect guesses and consumed-token reuse return failure values, commit the attempt/revocation, then throw outside the transaction.

Preserve PostgreSQL's existing isolation, unique/foreign-key constraints and user → session/challenge lock order. Refresh rereads the token after locks. Revocation and refresh serialize on the user, and there are no implicit retries. No cross-module transaction or reporting workflow currently exists. Repositories retain set-based SQL; refresh has a bounded query budget independent of other sessions, and logout adds one ownership lookup on the same connection.

`IdentityApi.authenticate` verifies the configured JWT and returns an immutable, process-local actor. `assertAuthenticated` rejects fabricated/copied actors and rechecks credential expiry. Identity application policies call it before work and validate the actor against the locked resource. A controller guard alone is insufficient. `/auth/me` additionally requires active verified account and live session; logout remains idempotent and permits a revoked/expired server session while its access credential is valid, so logout-all can still revoke remaining sessions. No roles, tenants or service actors exist yet; do not invent them. Future workers need explicit execution identities and current resource authorization.

Email delivery still uses the runtime-configured SES/local-file adapter synchronously inside registration/resend transactions. This preserves the established delivery-failure rollback contract. A successful email followed by commit failure can still contain an unusable code; the bounded call holds locks and cannot be undone. An outbox would require an intentional delivery/API consistency change, retries, duplicate handling and ordering, not merely another adapter.

## Replacement and extraction limits

Focused ports localize replacement work; they do not make it automatic. PostgreSQL UUID defaults, enum/timestamp representations, unique-error translation, upserts, foreign keys, row locks and isolation assumptions must be reimplemented and tested for another database. All five identity tables currently share transactions and foreign keys. Splitting credentials/sessions from accounts would break those local guarantees unless consistency and compensation are redesigned.

Extracting a capability also requires versioned remote contracts, service trust, credential verification, timeouts, uncertain-outcome handling, idempotency, retries and observability. A process-local actor cannot be serialized and accepted as proof: authenticate verified credentials again at the receiving boundary. There are currently no cross-module reports or event-ordering contracts to preserve; introduce explicit query boundaries and durable ordering when real consumers require them. A remote adapter cannot preserve local-call transaction semantics by keeping a method signature.

## Example future change

For an intentionally authorized session-list endpoint, HTTP validation/response mapping belongs in `identity/transport/http`; its application operation establishes the actor and requested scope; `application/policies/session-access.policy.ts` enforces ownership. Any pure session-state rule belongs in `domain/session-policy.ts`. A focused read contract in `application/ports` and a set-based implementation in `infrastructure/persistence` fetch only required fields without per-session service calls. Add contract and cross-user PostgreSQL tests. This example is guidance, not an implemented feature.

## Flutter

Feature-first layout with Riverpod 3, repository/service boundaries, and MVVM-style presentation.

- `lib/app` — composition, routing, theme
- `lib/core` — config, errors, network, shared widgets
- `lib/features/<name>` — data, presentation, and feature types together

Widgets depend on repositories/notifiers, not Dio. Network providers disable Riverpod's default automatic retry; the UI owns retry. Phase 3 adds `features/profile` using the same repository/service and Riverpod notifier conventions. The server supplies every option ID and display label; Flutter defines only the seven transport fields and their presentation. Authenticated routing loads persisted preferences before choosing the first incomplete step or Diagnostic Intro. Profile state is isolated by authenticated account and stale responses are discarded. In-memory drafts survive recoverable failures; only acknowledged steps advance, and confirmed logout clears that account’s in-memory state.

## Environments and persistence

Both API and mobile support `local`, `dev`, `staging`, and `production`. Configuration is loaded and validated at a single boundary. Feature adapters read typed config, never scattered raw environment maps. Database URL, JWT keys/issuer/audience, HMAC secret, email mode/sender/region and local inbox remain runtime configuration. JWTs, verification codes, refresh tokens, time and persisted state remain dynamically generated/read through the actual adapters. Values compiled into Flutter are public. Local Android emulator traffic uses `10.0.2.2` to reach the host API.

PostgreSQL + Drizzle ORM (`0.45.x`) + `pg`. Production uses reviewed `db:migrate`, never schema push. Drizzle Kit reads the platform schema catalog; its migration output remains `apps/api/drizzle`. Integration tests apply the migration to unique disposable databases, never reset the application database. Deployment/start commands and environment names are unchanged.

## Engineering profile consistency (Phase 3)

`profile` depends only on Identity's public contract. Its application operations call `IdentityApi.assertActiveVerified` before accessing preferences with the actor's user ID; no ownership ID is accepted from HTTP input. Identity checks provenance, expiry, active/verified account and live owned session under its established user → session locks. The check completes before the profile statement; a request already authorized may finish while logout races it. Later requests reject the revoked session. Profile never imports Identity repositories or schemas.

One nullable row per user stores the seven independent step values. A single SQL upsert replaces only supplied fields atomically, including concurrent first saves. Independent fields do not overwrite one another; concurrent writes to the same field use last committed replacement. Retries are semantically idempotent, although the internal update timestamp advances. No multi-table transaction coordinator is needed. Completion and next step are calculated from valid saved values, never stored page numbers or onboarding booleans.

The profile domain owns a frozen code catalog with stable IDs, labels, category, explicit array ordering, enabled state, recommendation metadata and exclusive groups. Technology additions or label changes require no user-record migration. Keep retired definitions disabled instead of deleting IDs while records refer to them; disabled selections make that step incomplete and can be replaced in Flutter. Stable role/experience/time checks also exist in PostgreSQL. DTO validation and domain validation reject duplicates, unknown IDs, empty values and competing primary learning approaches.

Migration `0001_hot_roxanne_simpson.sql` creates only `engineering_profiles`. Its user primary key prevents duplicate profiles; checks enforce nonempty arrays without null members, role/experience/time values and learning-approach compatibility. The cross-capability foreign key to `users(id)` with cascading deletion is declared explicitly in SQL, so Drizzle schema imports remain private and acyclic. Drizzle snapshots track the table and checks; this migration-owned foreign key must be preserved in future SQL reviews (generation alone does not inspect it). Use reviewed migrations, never schema push. Existing-data migration adds an empty table and does not rewrite Identity data.
