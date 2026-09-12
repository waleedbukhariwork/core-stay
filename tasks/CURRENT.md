# Backend architecture refinement — 2026-09-12

User-authorized follow-up to Phase 3: implement the agreed capability-first modular monolith with lightweight layers. Standardize HTTP DTO/response-mapper placement, tighten Profile's update/result contracts, remove Health's forwarding service, and update documentation and verification. Preserve current endpoints, runtime validation, Identity authorization/transactions and database schemas. This follow-up explicitly authorizes the structural changes described in ADR 0008; the original Phase 3 restrictions below remain the historical product scope.

Status: complete. API format/lint/typecheck/build, 84 unit/HTTP/architecture tests, the dedicated 15 architecture checks, 35 isolated PostgreSQL tests, and migration validation/drift checks passed. See `docs/STATUS.md` for executed checks and verification limits. Phase 4 remains out of scope.

---

# Phase 3 — Engineering Profile & Preferences

Status: development-complete (2026-09-11). Required automated verification passed; see `docs/STATUS.md`. New test cases were not added per the explicit user instruction; existing suites and one-off code/HTTP/database verification were run. Manual/device QA remains separately pending. Stop at Diagnostic Intro; Phase 4 has not started.

## Goal

Implement the authenticated CodeCore engineering-profile and preference setup flow.

This phase begins after successful authentication/email verification and ends at the
Diagnostic Intro boundary.

Follow the existing current architecture of the project consistently for both frontend
and backend.

Preserve existing naming, module boundaries, dependency direction, DTO/serialization,
repository, error-handling, logging, configuration, state-management, testing, and
security patterns.

Do not introduce a parallel architecture or restructure existing architecture unless
the requirement genuinely cannot be implemented correctly within it.

---

## User Flow

Authenticated + verified user

→ Goals
→ Role
→ Experience
→ Tech Stack
→ Focus Areas
→ Daily Time
→ Learning Preferences
→ Diagnostic Intro

Do NOT implement diagnostic questions in this phase.

---

## Core Requirement

Unlike the pre-auth product intro, these are real user preferences.

The authoritative state must be associated with the authenticated user and persisted
to the backend.

The client must NOT submit or choose a userId to establish ownership.

Ownership must come from the authenticated server-side principal/session.

A user should be able to:

- leave the flow
- restart the application
- sign in again
- resume from the appropriate incomplete step
- edit previous selections
- continue without losing successfully persisted progress

---

## Goals

Question:

"What are you working toward?"

Multi-select.

Initial options:

- Stay current in my field
- Strengthen fundamentals
- Become a better engineer
- Prepare for interviews
- Prepare for a senior role
- Improve system design
- Learn a new area

At least one required.

Use stable identifiers internally.

Do not persist display labels as authoritative values.

---

## Role

Single-select.

Initial options:

- Backend
- Frontend
- Full-stack
- Mobile
- DevOps / Platform
- Data
- Other

Required.

Do not infer seniority from role.

---

## Experience

Single-select.

Values:

- Less than 1 year
- 1–3 years
- 3–5 years
- 5–8 years
- 8+ years

Required.

Use stable internal identifiers rather than display strings.

Do not automatically convert these bands into Junior/Mid/Senior labels.

---

## Tech Stack

Searchable multi-select.

Initial supported technologies should cover at least:

Languages:
- JavaScript
- TypeScript
- Python
- Java
- Kotlin
- Dart
- Go
- C#
- C++
- Rust

Frontend:
- React
- Next.js
- Angular
- Vue
- Flutter

Backend:
- Node.js
- NestJS
- Express
- Spring Boot
- Django
- FastAPI
- .NET

Data:
- PostgreSQL
- MySQL
- MongoDB
- Redis

Cloud / Platform:
- AWS
- Azure
- GCP
- Docker
- Kubernetes

Technology definitions must have stable identifiers.

Do not duplicate the catalog across multiple widgets/files.

At least one technology is required.

The design must allow technologies to evolve later without coupling user records to
display labels.

---

## Focus Areas

Multi-select.

Options:

- Debugging
- API Design
- Databases
- Security
- Concurrency
- System Design
- Distributed Systems
- Testing
- Git & Collaboration
- Performance

At least one required.

Any automatic recommendations/preselection must be deterministic and clearly
distinguishable from user-selected values.

No AI is required here.

---

## Daily Time

Single selection:

- 5 minutes
- 10 minutes
- 15 minutes

10 minutes should be visually recommended.

Store the actual semantic value, such as minutes, rather than a UI label.

---

## Learning Preferences

Support:

- Challenge me first
- Explain first
- Real-world examples
- Visual explanations
- Deeper technical explanations

Model incompatible options deliberately.

In particular:

"Challenge me first"
and
"Explain first"

represent competing primary approaches and should not both be active simultaneously.

Other preferences may coexist.

Test these rules.

---

# Backend Persistence

Persist the engineering profile/preference state in PostgreSQL.

Design the persistence model around the information we actually need now.

Do not prematurely create tables for diagnostic, plans, skills or future AI features.

Requirements:

- user ownership enforced by authenticated identity
- database constraints where appropriate
- stable identifiers
- explicit migrations
- timestamps where useful
- update behavior is deterministic
- repeated equivalent requests are safe
- partially completed setup can be resumed

Do not return Drizzle/database models directly.

Use existing request DTO, response DTO and response serialization conventions.

Use class-validator for incoming request validation.

Reject unknown/unsupported identifiers.

---

# Flexible Preference Catalog

Avoid scattering hard-coded option definitions throughout Flutter and backend.

There should be one authoritative model for supported selectable values.

Prefer a solution consistent with the project's current architecture that gives us:

- stable IDs
- display labels
- grouping/category where required
- enabled/disabled capability
- predictable ordering
- room for future additions

Do not build a CMS or administration system in this phase.

Do not introduce unnecessary database complexity merely to avoid every constant.

Use judgment:

stable product concepts may be controlled code constants/enums;
evolving catalogs such as technologies should have a clean replaceable source.

The Flutter UI must not independently invent identifiers that the server does not
understand.

---

# Persistence Granularity

Do not wait until the very last screen to persist everything.

Persist valid progress at sensible step boundaries so completed work survives:

- app termination
- logout/login
- another device
- network interruption after earlier completed steps

However, do not create seven inconsistent APIs solely because there are seven screens.

Use a cohesive profile/preferences contract consistent with the existing API style.

Updates must be safe to repeat.

---

# Profile Setup State

The backend must be able to determine whether profile setup is:

- not started
- in progress
- complete

Do not rely solely on a client boolean.

Completion must be derived from or validated against required persisted information.

After completion, the server/client must know that the next product stage is:

DIAGNOSTIC

Do not mark diagnostic complete.

Do not mark general onboarding complete.

---

# Bootstrap / Resume

Integrate the profile state into the existing authenticated startup/bootstrap flow.

Expected behavior:

Authenticated user with no preferences
→ Goals

Goals complete but required role missing
→ Role

Role complete but experience missing
→ Experience

Continue according to actual valid persisted state.

Completed preferences
→ Diagnostic Intro

Do not blindly trust a stored "current page".

Derive the next valid step from server state.

A malformed/inconsistent response must fail safely.

---

# Offline / Network Behavior

The backend remains authoritative.

Flutter should preserve already-loaded in-memory state during transient failures.

Do not silently claim unsaved changes were persisted.

If saving a step fails:

- keep user's current selections
- show a recoverable error
- allow retry
- avoid duplicated updates

Network failure must not cause logout.

Do not add a local database or complex offline sync engine.

---

# Flutter UX

Reuse the existing design system and established patterns.

Requirements:

- polished professional visual quality
- Light / Dark / System themes
- responsive layouts
- safe areas
- scrolling where needed
- accessible controls
- clear selected/unselected states
- selected state not represented by color alone
- appropriate loading/saving states
- no blocking full-screen spinner for every tiny interaction unless necessary

Tech Stack search must be responsive and usable with the keyboard open.

Do not use fixed screenshot-specific dimensions.

---

# Navigation

Use existing routing patterns.

Requirements:

- forward navigation
- back navigation
- previous values remain selected
- resume from backend state
- repeated CTA taps do not duplicate saves/navigation
- Diagnostic Intro is the terminal Phase 3 destination

Do not implement Diagnostic Questions.

---

# Validation

Validation must exist at the appropriate boundaries.

Frontend validation improves UX.

Backend validation is authoritative.

Never rely on Flutter validation for security/integrity.

Test:

- empty required selections
- unsupported identifiers
- duplicate identifiers
- conflicting learning preferences
- invalid daily time
- invalid role/experience
- malformed payloads

---

# Response Data

Return only the information Flutter actually needs.

Do not expose:

- internal database IDs unnecessarily
- persistence metadata not needed by clients
- internal timestamps without a product reason
- Drizzle rows
- unrelated user/auth data

Use stable public identifiers.

---

# Concurrency / Updates

Preference updates should be deterministic and safe to retry.

Avoid:

- duplicate join-table records
- lost data from naive append behavior
- partial multi-table updates

Use transactions where one logical update spans multiple dependent writes.

Database constraints should enforce uniqueness where appropriate.

---

# Security / Privacy

Engineering preferences are user data.

Do not log the entire preference profile in routine request logs.

Do not include preference payloads in errors.

All mutation/read endpoints require authentication.

A user must never be able to read or modify another user's preferences by changing a
request parameter.

Do not accept user ownership from request body/query/path where it is unnecessary.

---

# Tests — Backend

Add meaningful automated coverage for:

- create/update profile preferences
- authenticated ownership
- unauthenticated access denied
- stable identifier validation
- invalid identifiers
- duplicate values
- learning preference conflicts
- daily-time validation
- partial progress
- completion determination
- safe repeated updates
- transaction behavior where applicable
- DB uniqueness/constraints
- response serialization
- other users' data inaccessible
- resume/next-step calculation

Use PostgreSQL integration tests where persistence guarantees matter.

---

# Tests — Flutter

Automated tests should cover:

- Goals multi-select
- Role single-select
- Experience selection
- Tech Stack search/filter/select
- Focus Areas
- Daily Time
- Learning Preference compatibility rules
- required CTA states
- backend loading
- save success
- save failure + retry
- selections retained after save failure
- previous values restored from server
- back navigation
- resume from each meaningful incomplete stage
- completed profile → Diagnostic Intro
- repeated CTA protection
- Light theme
- Dark theme
- compact layout
- increased text scaling
- keyboard/search layout where relevant

Use existing testing patterns.

Do not add tests solely to increase coverage percentage.

---

# Dependencies

Do not add a package if existing project capabilities can solve the requirement cleanly.

In particular, do not add:

- local database
- state-management alternative
- service locator
- responsive framework
- form framework
- search package
- UI kit
- analytics
- AI library

without an actual demonstrated requirement.

---

# Out of Scope

Do NOT implement:

- diagnostic questions
- diagnostic scoring
- confidence scoring
- skill profile
- Engineering Health
- plan generation
- Today screen
- learning content
- practice sessions
- AI personalization
- RevenueCat
- OneSignal
- voice
- analytics
- social login
- password reset

Do not create fake implementations for future phases.

---

# Automated Verification

Follow the repository verification policy.

Backend:
- formatting
- lint
- typecheck
- unit tests
- integration tests
- build
- migration validation

Flutter:
- dart format
- flutter analyze
- flutter test
- Android debug build

Manual/device QA is NOT required unless explicitly requested separately.

Report manual QA as pending.

---

# Documentation

Update docs/STATUS.md after successful implementation.

Update other durable documentation only if a real contract or architecture decision changed.

Do not duplicate current architecture documentation inside the task completion report.

---

# Completion Criteria

Phase 3 is development-complete when:

1. Only authenticated/verified users can access profile setup.
2. Goals persist correctly.
3. Role persists correctly.
4. Experience persists correctly.
5. Tech Stack persists correctly.
6. Focus Areas persist correctly.
7. Daily Time persists correctly.
8. Learning Preferences persist correctly.
9. Backend is authoritative.
10. Profile progress survives application restart.
11. Progress survives logout/login.
12. Resume goes to the first logically incomplete step.
13. Unsupported data is rejected server-side.
14. Ownership cannot be spoofed from the client.
15. Repeated updates are safe.
16. Required DB constraints exist.
17. API responses expose only intended data.
18. Flutter remains responsive and theme-compatible.
19. Diagnostic Intro is reached after profile completion.
20. Diagnostic questions are not implemented.
21. Backend automated checks pass.
22. Flutter automated checks pass.
23. Android debug build passes.
24. No unrelated dependency/architecture changes were introduced.

Manual QA remains separately pending.

---

# Completion Report

Keep the final report concise.

Report only:

1. implemented flow
2. database/migrations added
3. API contracts added
4. important behavior decisions
5. dependencies added, if any
6. backend automated verification results
7. Flutter automated verification results
8. deviations from task and why
9. manual QA pending
10. readiness for Phase 4

Do not begin Phase 4 automatically.
