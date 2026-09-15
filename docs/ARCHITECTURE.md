# Architecture

CodeCore is a capability-first, deployment-independent modular monolith: one NestJS API and one Flutter app. Each backend capability uses lightweight layers proportional to its behavior, with ports for persistence and external integrations. Application code does not assume a specific host; email delivery has an SES infrastructure adapter. See [ADR 0008](adr/0008-lightweight-capability-layers.md) for the layout refinement.

## Backend ownership

| Capability | Owns | Exposes |
| --- | --- | --- |
| `identity` | Accounts, password credentials, email verification, authentication and sessions; all five existing tables and their writes | `IdentityApi`: authenticate access credentials, assert actor provenance/expiry, and validate an active verified account/live session; existing `/auth/*` HTTP contracts |
| `profile` | Engineering preferences, selectable catalog, setup completion and resume state; `engineering_profiles` and its writes | Authenticated `/profile` read/update and `/profile/catalog` HTTP contracts; `ProfileApi.isComplete` for authorized setup eligibility |
| `diagnostic` | Diagnostic definitions, sessions, attempts, confidence and deterministic evaluation; `diagnostic_sessions` and `diagnostic_attempts` and their writes | Authenticated `/diagnostic` read/start, `/diagnostic/answers` submission and `/diagnostic/confidence` update |
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
      transport/http/                   # controllers, guards, response/error mappers
        dto/                            # request classes and explicit response shapes
      application/                      # registration/login, verification, session use cases
        policies/                       # verified actor and resource ownership
        ports/                          # unit of work, focused repositories, clock, token/code/email adapters
      domain/                           # account/challenge/session models, invariants, failures
      infrastructure/
        persistence/                    # schemas, Drizzle repositories and transaction implementation
        crypto/, email/, config/        # configured adapters; actual system clock
    profile/
      profile.module.ts                 # composes Identity through its public API
      transport/http/                   # controller, guard, response/error mappers
        dto/                            # update request, profile response, catalog response
      application/                      # profile operations and focused repository port
      domain/                           # authoritative catalog, validation and progress
      infrastructure/persistence/       # atomic partial upsert and profile schema
    health/
      health.module.ts
      application/                      # probe contract and connectivity failure
      infrastructure/persistence/       # PostgreSQL probe
      transport/http/                   # controller invokes probe; response/error mappers
        dto/                            # health response shape
apps/api/drizzle/                        # established migration path, unchanged
```

Health stays small: its controller invokes the application-owned `DatabaseProbe` contract directly, and Nest binds that contract to the PostgreSQL adapter. It needs no forwarding service, domain, public facade, or transaction coordinator. There are no placeholder modules, workflows, background jobs, events or internal HTTP services.

## Dependencies and contracts

Transport invokes application behavior and maps plain results to explicit response DTOs. Application coordinates domain policies and calls ports implemented by infrastructure. Domain imports only its own domain code. Nest DI is allowed in application and infrastructure; HTTP and ORM types are not application contracts. Application services remain cohesive use cases rather than one class per method. A validated scalar input does not need an extra pass-through input class.

Every capability keeps request/response DTOs in `transport/http/dto/`, response mapping in `*-response.mapper.ts`, and failure mapping in `*-error.mapper.ts`. Related DTO classes may share a focused file (as Identity's authentication requests do); request validation and response construction do not share a file. Explicit mappers select public fields: DTO class declarations alone do not filter runtime objects. Controllers handle route metadata, actor/body extraction and invoking those mappers.

Profile demonstrates the full flow: guard authenticates credentials → DTO validates HTTP input → `ProfileService` authorizes the actor, invokes domain validation, and calls `ProfileRepository` → the Drizzle adapter performs the atomic upsert → domain progress is calculated → the response mapper selects public fields. `ProfileResult` is a plain application result, distinct from HTTP DTOs. `ProfileUpdate` permits omitted fields but excludes null values; nullable `ProfilePreferences` represents persisted setup state. Catalog responses enumerate the seven public keys, and response next steps use their explicit string union. A structurally compatible validated DTO can be passed directly to the service without an extra copying layer; application code never imports that DTO.

Use services where authorization, orchestration or transaction ownership requires them. A technical probe may call its application port directly from transport; transport still cannot import an infrastructure adapter. Pure domain functions are sufficient for preference validation/progress. Expose public module APIs only when another capability consumes them, and introduce units of work only for workflows with dependent writes.

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

## Diagnostic consistency (Phase 4)

Diagnostic follows the existing transport → application/domain → persistence port convention. It consumes `ProfileApi.isComplete`, implemented by the existing Profile service, which verifies the original actor through Identity before reading completion. Public contracts remain plain and self-contained; actor shape alone is never accepted as proof. Diagnostic HTTP guards consume only Identity's public API. Authorization finishes before the diagnostic transaction, retaining the established in-flight logout race semantics described for Profile.

The application owns `DiagnosticUnitOfWork.transaction`; its scoped store uses one Drizzle transaction for the owned session lock, attempts, confidence and completion. Uniqueness on user/diagnostic prevents replaying a completed initial diagnostic, a partial unique index prevents multiple active sessions, and the attempt primary key permits one answer per session/question. Concurrent starts use insert-on-conflict followed by a row lock; all later operations lock the owned session before reading or writing attempts. Identical retries read saved evidence; different answers conflict. Migration `0002_previous_scalphunter.sql` adds empty tables and preserves existing data. Its user FK/cascade is migration-owned, like Profile's, and must be preserved in later SQL reviews.

Definitions are code-controlled and sessions retain their original definition version. Keep published versions and stable question/skill/concept/difficulty/interaction IDs unchanged while evidence references them. No approved content was supplied for this implementation; the registry is intentionally unpublished and start returns `DIAGNOSTIC_UNAVAILABLE` without creating a session. The model supports five question categories through single-choice rendering; additional interactions can extend question/answer handling without changing session lifecycle. Explicit HTTP mappers exclude answer keys, explanations, difficulty/scoring internals and persistence fields until review is appropriate. Configured confidence is saved before review; resume returns unfinished confidence or the next unanswered question. Completion is atomic with the last required evidence write.

Flutter's diagnostic repository/service and account-scoped Riverpod notifier own server snapshots and transient selections. Presentation uses reusable question/review widgets and existing theme/layout tokens. Restart reloads server progress; no local question index or diagnostic database is introduced. Recoverable failures retain selections, identical submission retries resolve uncertain outcomes, and conflicts reload server state. Review visibility is transient presentation state; it is not a second source of diagnostic progress.

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
