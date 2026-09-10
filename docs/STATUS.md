# Status

## Phase 0 implemented

- pnpm workspace with NestJS API and a standard Flutter app (not a Node workspace)
- Typed, validated API configuration for local/dev/staging/production
- Global `/api/v1`, validation pipe, Problem Details errors, structured logging, request ids
- Drizzle 0.45 + pg + migration config; no product tables
- Local Postgres via Docker Compose
- `GET /api/v1/health` proving API liveness and database connectivity
- Flutter feature-first foundation: config, theme tokens, Dio client, Health vertical slice
- GitHub Actions quality workflow
- Minimum backend and Flutter tests

## Phase 1 implemented — code verification complete

- Entry flow: Splash → Welcome → three-page, skippable Product Preview → Account Entry Boundary
- Existing-account action reaches Account Entry; Phase 2 makes its actions functional
- One Riverpod controller owns intro state; a small `shared_preferences` store persists only `hasSeenProductIntro`
- Completing/skipping the preview saves the flag; returning launches go directly from Splash to account entry
- Unavailable, corrupt, or stalled reads fall back to Welcome; failed writes allow entry for the current session
- Central named routes, safe back/repeated-tap handling, native restrained motion, light/dark/system themes
- 52 Flutter tests pass, including 42 entry state/routing/responsive tests; formatting and analysis pass with zero issues
- Android debug APK build passes (`flutter build apk --debug`)
- API format/lint/typecheck, 14 tests, and build pass
- Pixel 10 runtime verification deferred to the user; no iOS runtime verification on Linux
- Preserved by the Phase 2 regression suite

## Phase 2 implemented — automated verification complete

- Registration → six-digit email verification → authenticated Profile Setup Boundary; login, startup restoration, rotating refresh, logout and backend logout-all
- Users identity boundary; separate credentials, challenges, sessions and refresh history in five PostgreSQL tables; migration `0000_melted_mastermind.sql`
- Argon2id passwords, HMAC verification challenges, 10-minute HS256 access JWTs, 256-bit opaque rotating refresh tokens and fixed 30-day server sessions
- PostgreSQL row locks and transactions cover duplicate registration, verification/resend races, refresh reuse and revocation; attempts/reuse revocation survive error responses
- SES adapter for non-local environments; private local email files gated to `local`; no real email sent in tests
- Flutter secure refresh storage, access tokens in memory, one concurrent refresh, single retry, recoverable network/storage state, safe logout and protection from stale responses
- Phase 1 first-run routing retained; auth screens pass light/dark and 2× text-scale checks at compact width; no engineering preferences collected
- Dependencies: `argon2` 0.45.1 (PHC hashing/verification), `jose` 6.2.12 (JWT validation), `@aws-sdk/client-sesv2` 3.1128.0 (SES adapter), `flutter_secure_storage` 10.3.2 resolved (platform secret storage). Existing toolchain compatibility verified through analysis/builds. Only Argon2's required native install script was newly enabled; pnpm recorded an exact-version SES release-age exception for this reviewed dependency.
- Backend: 37/37 unit/HTTP tests and 28/28 real PostgreSQL integration tests; format, lint, full TypeScript checks including tests and Nest build pass
- Migration generation reports no drift; Drizzle validation passes; migration applies idempotently in disposable test databases and has been applied to local CodeCore PostgreSQL
- Flutter: 107/107 tests; format check reports no changes; analyzer reports zero issues; Android debug APK build passes
- CI now includes PostgreSQL integration/migration drift checks and Android debug build. The workflow was updated locally; a hosted CI run has not been triggered.
- Recognized secret-pattern scan and tracked/unignored runtime-artifact checks found no issues; existing Phase 1 edits are preserved

Design choices: pending registration resumes only for the same password; `/auth/me` checks live session state; strict refresh reuse has no grace window; synchronous bounded email delivery avoids introducing a queue/outbox. See `SECURITY.md` and ADR 0006 for the lost-response/email-commit limitations.

Manual emulator/device/visual QA and iOS runtime checks remain pending separately, not completion blockers. Live SES delivery and deployment TLS/edge-rate-limit configuration have not been exercised. Ready for Phase 3 development; Phase 3 has not started.

## Backend architecture migration — complete

Scope was backend architecture and durable documentation after Phase 2. Earlier uncommitted Phase 1/2 product work was retained. No product features, public endpoint changes, new dependencies, deployment or application-database reset were introduced.

- Consolidated Auth/Users into `identity`, owning accounts, credentials, challenges, sessions and refresh history. Removed the pass-through Users facade and old implementation paths.
- Moved technical infrastructure to `platform`; migrated Health as the first complete vertical slice. Identity separates HTTP DTO/mapping, application use cases/authorization/ports, pure domain policy/failures and infrastructure implementations.
- Application-owned units of work share one transaction connection across all participating repositories. Retained constraints, lock order, rotation/reuse, rollback and commit-before-error semantics.
- Closed the internal plain-principal authorization gap: verified immutable actors, expiry assertion and explicit resource ownership at application boundaries. Preserved HTTP token/session behavior, including idempotent logout and logout-all from a revoked session with valid access.
- Retained all nine HTTP contracts and runtime configuration/integrations. SES/local inbox, PostgreSQL state, signing configuration, random token/code generation and real time remain adapter-driven; nothing was replaced with static/demo data. No jobs, events, webhooks or tenants existed to migrate.
- Added enforced import/layer/module cycle checks using existing TypeScript/Vitest tooling, wired into CI and regular tests. Registered-route discovery verifies exactly nine routes without duplicate controllers.
- Recorded permanent rules in `ENGINEERING.md`, ownership/coupling and future-change guidance in `ARCHITECTURE.md`, the decision in ADR 0007, and endpoint/security behavior in their existing documents. ADR 0006 remains a historical record with an explicit supersession note.

| Verification | Executed result |
| --- | --- |
| Baseline | API format/lint/full typecheck/build/migration check; 37 unit/HTTP tests and 28 PostgreSQL tests passed; no pre-existing code failures |
| Pre-migration characterization | Exact fifth-guess 400, locked-challenge/cooldown 429 and Problem Details/header behavior added and passed; PostgreSQL total 29 |
| Platform/Health increment | Full typecheck and the existing 37 unit/HTTP tests passed |
| Final unit/HTTP/architecture | 69/69 tests across 14 files passed; includes all existing tests, 15 boundary checks, route inventory and error-mapping compatibility |
| Final PostgreSQL | 35/35 tests passed against a uniquely created disposable database, applying the reviewed migration twice; includes rollback/races, forged/cross-user/expired actors and logout semantics |
| Query/connection regression | Refresh with 50 sibling sessions used one acquired connection and stayed within ten SQL calls including transaction control |
| Static/build | API format check, lint, full TypeScript check including tests, Nest build and dedicated architecture check passed |
| Migrations | Drizzle generation reported five tables and no changes; Drizzle check passed. No migration or schema changes were required |
| Protected files | 126 mobile/migration/environment-example/lockfile files matched the captured continuation checkpoint byte-for-byte. The earlier temporary baseline snapshot was unavailable after resumption; this checksum claim covers the continuation checkpoint, not a reconstructed pre-migration snapshot |
| Diff/security hygiene | `git diff --check`, recognized secret-pattern scan and unignored runtime-secret artifact check passed; no obsolete source imports remain outside historical ADR text |

HTTP tests initially hit sandbox `listen EPERM`; rerunning with local-server access passed. PostgreSQL tests used authorized local connectivity and removed only their own disposable database. No local application migration was applied by this architecture migration.

Verification limits: Flutter was untouched and its preceding Phase 2 checks were not rerun for this backend-only task. Hosted CI, live SES, deployment/TLS/load testing and manual emulator/device/iOS QA remain unexecuted here. The existing Vite tsconfig-paths deprecation notice is informational; no toolchain dependency was changed. Synchronous email inside transactions and PostgreSQL-specific atomicity/locking remain documented limitations, not automatic ORM/service replaceability. Phase 3 has not started.

## Intentionally unimplemented

Engineering profile/preferences onboarding, diagnostic, plans, practice, AI, RevenueCat, OneSignal, analytics, Redis, queues, Terraform/deployment, voice, and placeholder feature modules.
