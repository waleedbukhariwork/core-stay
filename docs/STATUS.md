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

Manual emulator/device/visual QA and iOS runtime checks remain pending separately, not completion blockers. Live SES delivery and deployment TLS/edge-rate-limit configuration have not been exercised. This was the Phase 2 verification checkpoint; the completed Phase 3 work is recorded below.

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

Verification limits: Flutter was untouched and its preceding Phase 2 checks were not rerun for this backend-only task. Hosted CI, live SES, deployment/TLS/load testing and manual emulator/device/iOS QA remain unexecuted here. The existing Vite tsconfig-paths deprecation notice is informational; no toolchain dependency was changed. Synchronous email inside transactions and PostgreSQL-specific atomicity/locking remain documented limitations, not automatic ORM/service replaceability. Phase 3 implementation is recorded below.

## Phase 3 implemented — automated verification complete

- Authenticated Goals → Role → Experience → searchable/grouped Tech Stack → Focus Areas → Daily Time → compatible Learning Preferences → Diagnostic Intro. The existing Flutter feature/repository/service/Riverpod and backend capability/layer boundaries are retained.
- One backend catalog supplies stable IDs, labels, ordering, enabled state, categories, recommendation and exclusivity metadata, including 31 technologies. Ten minutes is visually recommended without preselection; no inferred seniority or automatic focus recommendations. At least one learning preference is required; a primary approach is optional, and its two alternatives cannot coexist.
- `GET /api/v1/profile/catalog`, `GET /api/v1/profile`, `PATCH /api/v1/profile`. All require active verified Identity/session authorization in the application as well as HTTP authentication. Ownership comes solely from the authenticated actor; DTO/domain validation rejects unknown, duplicate, empty, conflicting or unsupported values.
- `engineering_profiles` stores one partial profile per user with stable values and internal timestamps. Migration `0001_hot_roxanne_simpson.sql` adds the primary key, ownership FK/cascade, required array-shape/value checks, role/experience/time constraints and primary-approach constraint. Existing migrations and Identity rows were preserved. The reviewed migration was also applied successfully to local development PostgreSQL on port 55432.
- Atomic partial upserts preserve unrelated fields during concurrent first saves. Same-field concurrent updates use last committed replacement. Retries replace equivalent values safely. Backend-derived status and first incomplete step control startup/resume; completion leads only to `DIAGNOSTIC`.
- Flutter retains local edits during recoverable failures, accepts server updates for unedited fields, disables repeated save taps, advances only after acknowledgment, and isolates profile state across account changes. Back navigation restores selections; completed users can review preferences. Existing theme tokens, safe areas, scrolling and accessible selection indicators are reused.
- No dependencies or new test cases were added, following the user's explicit instruction overriding the task's new-test sections. Existing route/migration expectations and auth-flow fixtures/assertions were updated for the intentional contract changes. One-off smoke commands remained outside the repository.

| Automated verification | Executed result |
| --- | --- |
| Backend static/build | Format check, lint, full TypeScript check, dedicated architecture check (15 checks), and Nest build passed |
| Existing backend unit/HTTP/config/security suite | 69/69 passed across 14 files, including route inventory and architecture boundaries |
| Existing PostgreSQL suite | 35/35 passed in a uniquely created disposable database; both migrations applied twice without duplication |
| Profile HTTP/SQL smoke | Passed seven-step saves/resume, 31-option technology catalog, response fields/cache headers, empty/unknown/duplicate/null/malformed/conflicting values, repeat/reordered updates, concurrent independent fields, account isolation, forged/revoked/unverified access, database PK/FK/value constraints, and logout/login restoration; disposable database removed |
| Client/server contract | Flutter's real profile model decoded actual API catalog and all eight persisted snapshots, yielding resume indices 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 (Diagnostic Intro) |
| Migrations/configuration | Drizzle check passed; generation reported no drift; local migration applied successfully; Docker Compose configuration validation passed; API and mobile environment-validation tests passed |
| Flutter static/regression | Dart formatting reports zero changes; analyzer reports zero issues; 107/107 existing tests passed, including the real Goals screen reached by auth and existing compact light/dark/text-scale checks |
| Android | `flutter build apk --debug` passed; output `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk` |
| Hygiene | Final diff whitespace and recognized secret-pattern checks passed; no runtime-secret artifacts or dependency changes added |

Initial local HTTP/PostgreSQL and Flutter cache checks encountered sandbox access restrictions; approved reruns passed. A one-off smoke harness initially omitted required PORT configuration; correcting that harness made the check pass. Vite's existing tsconfig-paths notice and Gradle/JDK native-access warnings were non-blocking.

Verification limits: no new Phase 3 unit/widget test cases were authored by request. Manual/device/visual/keyboard exploratory QA, iOS runtime/build and hosted CI remain separately pending. Diagnostic questions and all Phase 4 behavior remain unimplemented. Phase 3 is development-complete and ready for Phase 4 planning; Phase 4 was not started.

## Backend architecture refinement — complete (2026-09-12)

User-authorized follow-up to the architecture review. Retained the capability-first modular monolith with Identity, Profile, Health and shared technical platform code; refined layer depth and HTTP file conventions as recorded in ADR 0008.

- Profile now has separate update/profile-response/catalog-response DTO files under `transport/http/dto/` and a response mapper. Its controller handles HTTP metadata, actor/body extraction and application invocation. Request decorators, response fields, headers and errors retain their existing behavior.
- Profile's plain update contract excludes null, while persisted preferences remain nullable. Application results have explicit return types; HTTP catalog keys and next-step values are precisely declared. Its pure validation/progress functions, repository boundary and atomic SQL upsert remain in place.
- Health invokes the application-owned database probe directly from its controller. Removed the forwarding service, moved its two existing unit checks to the controller, and separated response DTO/mapping. The HTTP failure test now supplies the adapter's actual application failure so it exercises error-mapper wiring.
- Added 15 retained Profile HTTP regression cases for public response fields, partial-update normalization, catalog metadata, validation failures and denial before persistence. These use Identity/repository doubles to isolate HTTP and application behavior; they do not establish PostgreSQL concurrency or actor provenance. The existing real Identity/PostgreSQL suite was also rerun.
- Existing architecture rules remain unchanged. Extended the positive fixture to explicitly exercise transport invoking an application port. Updated Architecture, Engineering, API Conventions, the current task and ADR 0008.
- Reviewed authorization locking and retained user → session locks, process-local actor provenance and existing revocation semantics. Synchronous email/transaction behavior remains a documented operational tradeoff. No dependency, product scope, Flutter wire contract, schema or migration changes.

| Verification | Executed result |
| --- | --- |
| API format/lint/typecheck | All passed |
| Unit/HTTP/architecture suite | 84/84 passed across 15 files, including the 15 new Profile HTTP cases and moved Health checks |
| Dedicated architecture check | 15/15 passed; no relaxed rules |
| PostgreSQL integration | 35/35 passed against a uniquely created disposable database, with both migrations applied twice; only the test database was removed |
| Build | Nest build passed |
| Migrations | Drizzle check passed; generation reported six tables and no schema changes; no migration applied to the application database |
| Diff hygiene | `git diff --check` passed; obsolete source imports removed; mobile, migrations, dependency manifests and lockfiles unchanged |

PostgreSQL execution initially encountered sandbox `connect EPERM`; the rerun with local database/socket access passed. HTTP tests also ran with local socket access. The existing Vite tsconfig-paths deprecation notice remains informational.

Verification limits: Flutter format/analyze/tests and Android build were not rerun because mobile code and the shared wire contract were unchanged. Profile database races were not re-tested by the new HTTP cases; their earlier smoke verification is recorded in the Phase 3 checkpoint above. Load testing, live SES, hosted CI and manual/device/iOS verification remain unexecuted in this follow-up. Phase 4 has not started.

## Phase 4 engine and UI implemented — approved content pending (2026-09-13)

Phase 4 is **not development-complete**. The supplied scope prohibits AI-generated questions and AI-determined answer keys, and no approved catalog was present in the request or repository. The engine therefore has an unpublished definition registry; start returns recoverable 503 `DIAGNOSTIC_UNAVAILABLE` without creating an empty session. Product-approved questions/options/keys/explanations/key ideas and their stable metadata are required to activate and finish the flow. Phase 5 has not begun and is not ready to consume real diagnostic evidence yet.

- Added the Diagnostic capability using the existing controller/DTO/mapper, application/domain, focused transaction-store and Drizzle boundaries. Added only the consumed `ProfileApi.isComplete` public contract, preserving Profile HTTP behavior and verified actor provenance checks. Architecture rules were not relaxed.
- Implemented authenticated start/resume, server-derived ordered progress, authoritative single-choice evaluation, optional semantic confidence before review, curated explanation/key-idea review, and atomic completion. Five question categories are supported by the content model; no content was fabricated. Published versions must be retained unchanged for existing sessions.
- Added `GET /diagnostic`, `POST /diagnostic`, `POST /diagnostic/answers` and `PATCH /diagnostic/confidence` under `/api/v1`, preserving the existing envelope, validation, errors, logging and no-store conventions. Explicit mappers exclude pre-answer truth and persistence fields.
- Migration `0002_previous_scalphunter.sql` and its Drizzle snapshot add `diagnostic_sessions` and `diagnostic_attempts`, ownership/session FKs with cascade, uniqueness for user/diagnostic and active sessions, one attempt per question, status/time, confidence and duration checks. Raw stable question/skill/concept/difficulty/interaction IDs, selected answer, correctness, duration, confidence and timestamps are retained. Existing migrations/data are unchanged; the migration was exercised in disposable PostgreSQL only and has not been applied to the application database.
- Session row locks serialize answer/confidence/completion transactions. Concurrent starts use database uniqueness and resume the winner. Identical answer/confidence retries return saved evidence; changed answers conflict; completed sessions cannot reopen. Eligibility is checked before each application operation, with the existing in-flight logout authorization semantics.
- Flutter now renders start, loading/resume, questions, selection/submission, confidence, review, recovery and completion using an account-scoped Riverpod notifier, repository/service boundary and reusable question/review widgets. The existing diagnostic route loads persisted state before selecting intro/active/completed presentation. Selections survive failed requests; retries and conflict recovery resolve from server state. No local diagnostic storage/index was introduced.
- No dependencies, new test cases, AI services, mastery/Engineering Health calculations, Starting Skill Profile, plans or future-feature placeholders were added. Existing route inventory and migration-count assertions were updated for the intentional additions. Product scope and API documentation were reconciled; architecture documentation records only the new consumed public contract and actual diagnostic boundaries.

| Automated verification | Executed result |
| --- | --- |
| API static/build | Format check, lint, full typecheck and Nest build passed |
| Architecture | 15/15 existing checks passed, with unchanged enforcement |
| Existing API suite | 84/84 tests passed across 15 files |
| Existing PostgreSQL suite | 35/35 tests passed in a unique disposable database; all three migrations applied twice, only that database removed |
| Migrations | Drizzle check passed; subsequent generation reported eight tables and no schema drift |
| Flutter | Full Dart format check passed; analysis reported no issues; 107/107 existing tests passed |
| Android | Debug APK built at `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk` |

Initial HTTP/PostgreSQL and Flutter commands hit sandbox socket/cache restrictions; approved reruns passed. The existing Vite and JDK notices remained non-blocking. The existing regression suites do not establish the new diagnostic endpoint/concurrency behavior; no new tests were authored per request. Full real-content flow verification remains pending the catalog. Manual/device/visual QA, iOS and hosted CI remain separately pending.

## Intentionally unimplemented

Published diagnostic question content (awaiting approval), final diagnostic/skill scoring, plans, practice, AI, RevenueCat, OneSignal, analytics, Redis infrastructure, queues, Terraform/deployment, voice, and placeholder feature modules.
