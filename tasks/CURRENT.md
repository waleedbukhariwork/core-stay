# Phase 4 — Diagnostic Engine

## Goal

Implement CodeCore's authenticated engineering diagnostic engine.

This phase begins at the existing Diagnostic Intro screen and ends when the
diagnostic session is complete.

Do not implement the Starting Skill Profile, Engineering Health score, or initial
personalized plan in this phase.

Follow the existing current architecture of the project consistently for both
frontend and backend.

Preserve existing module boundaries, dependency direction, repository patterns,
DTO/response serialization, validation, logging, configuration, error handling,
Riverpod state management and security conventions.

Do not introduce a parallel architecture or restructure the existing architecture
unless genuinely required.

Do not create new test cases unless explicitly requested.

---

## Flow

Diagnostic Intro
→ Start Diagnostic
→ Question
→ Submit Answer
→ Confidence when configured
→ Answer Review
→ Next Question
→ Diagnostic Complete

Diagnostic Complete is the Phase 4 terminal boundary.

Phase 5 will build the Starting Skill Profile from diagnostic evidence.

---

## Product Intent

The diagnostic measures engineering understanding and judgment rather than trivia.

Initial question categories should support:

- Scenario Judgment
- Predict Outcome
- Spot the Bug
- Better Approach
- Conceptual Reasoning

The architecture should allow additional interaction types later without rewriting
the diagnostic session model.

Do not implement free-form AI scoring or voice evaluation.

---

## Diagnostic Content

Diagnostic truth must be deterministic and curated in this phase.

Do not use AI to determine:

- the correct answer
- technical truth
- diagnostic scoring

Use stable identifiers for:

- question
- skill
- concept/subskill
- difficulty
- interaction type

Do not couple stored attempts to display labels.

The initial question catalog may be code/seed controlled according to the existing
backend architecture.

Do not build a CMS/admin system.

---

## Question Contract

A question available to Flutter should expose only data needed to answer it.

Conceptually:

- public question id
- interaction type
- skill/concept display information where appropriate
- difficulty if product UX requires it
- prompt
- code/example/context
- answer options
- whether confidence is requested

The pre-answer response must NOT expose:

- correct answer
- scoring metadata
- internal answer key
- hidden explanation
- internal persistence fields

Mobile clients must not be trusted with diagnostic truth.

---

## Answer Submission

Answer evaluation is authoritative on the backend.

Flutter submits:

- question identifier
- selected response
- optional client timing metadata if required

Do not accept from the client:

- correctness
- score
- skill result
- answer key

Backend determines correctness.

After submission return an explicit review contract containing only appropriate data,
such as:

- correct / incorrect
- correct answer or expected reasoning where appropriate
- explanation
- key idea
- related concept information where useful

Do not return internal scoring implementation details unnecessarily.

---

## Confidence

Confidence is not required for every question.

Questions may configure whether confidence is requested.

Supported values:

- Guessing
- Somewhat sure
- Very sure

Persist the semantic confidence value.

Confidence is evidence for future calibration and skill analysis.

Do not calculate a final confidence score in this phase.

---

## Diagnostic Session

Persist diagnostic sessions in PostgreSQL.

A session should support at least:

- authenticated user ownership
- status
- started time
- completion time
- diagnostic/version identifier
- current progress derived from persisted attempts
- attempt history

Statuses should remain minimal and meaningful, for example:

- active
- completed

Add additional states only if genuinely required.

A user must not create uncontrolled duplicate active diagnostic sessions.

Starting the diagnostic repeatedly should safely return/resume the appropriate
active session where product behavior requires it.

---

## Attempts

Persist one authoritative answer attempt per question for the initial diagnostic
unless the product requirement explicitly allows retries.

Persist enough raw evidence for Phase 5, including as appropriate:

- question
- answer
- correctness
- response duration
- confidence
- answered time

Do not calculate or persist speculative final mastery/Engineering Health values yet.

Database constraints should protect relevant uniqueness and ownership invariants.

---

## Resume

The backend is authoritative.

If the application closes during an active diagnostic:

authenticated user
→ profile already complete
→ active diagnostic exists
→ resume at the next unanswered question

Do not trust a locally stored question index as authoritative.

Flutter may preserve presentation state in memory, but server state determines
diagnostic progress.

A completed diagnostic must not reopen as active.

---

## Question Ordering

The initial diagnostic must have deterministic ordering.

Do not introduce AI-driven adaptive question selection yet.

A versioned diagnostic definition is preferred so future question-set changes do not
silently alter an in-progress diagnostic.

Existing sessions should remain tied to the diagnostic definition/version they began with.

Keep implementation proportional; do not build a generalized assessment platform.

---

## Backend Ownership

Add diagnostic capability following the project's existing capability-first modular
monolith architecture.

Use the existing layering and module conventions already established in the project.

Do not re-document or redesign the architecture inside this phase.

All diagnostic read/write endpoints require authenticated and verified users who have
completed the engineering-profile setup.

User ownership comes from authenticated identity.

Do not accept arbitrary userId ownership from request payloads.

---

## API

Use the existing API conventions.

The capability should support the equivalent of:

- start/resume diagnostic
- get current question/session progress
- submit answer
- submit/update confidence where required
- continue to next question
- obtain diagnostic completion state

Exact endpoint shape should follow existing project conventions.

Avoid one endpoint per UI button if a more cohesive API contract is appropriate.

Use:

- request DTOs
- class-validator
- response DTOs
- response mappers
- existing error contract

Do not expose Drizzle rows directly.

---

## Validation

Backend validation is authoritative.

Reject:

- unknown question identifiers
- answers not valid for the question
- duplicate submissions where not allowed
- answering questions outside the user's session
- answering already-completed sessions
- invalid confidence values
- malformed payloads
- unauthorized access

Flutter validation exists for UX only.

---

## Concurrency / Idempotency

Protect against:

- double answer submission
- repeated CTA taps
- two requests answering the same question concurrently
- accidental duplicate session creation

Database constraints and transactions should enforce important invariants.

Do not rely only on UI button disabling.

Equivalent repeated operations should have deliberate behavior.

---

## Flutter

Extend the existing diagnostic feature using the project's established Flutter
architecture.

Use the existing Riverpod/state-management patterns.

Required UI states:

- loading/resuming diagnostic
- active question
- selected answer
- submitting
- answer review
- recoverable failure
- completed

Do not create a second competing source of truth.

Presentation must not call Dio directly.

---

## Question UI

Create clean reusable rendering for the supported question interactions.

Avoid one enormous diagnostic screen with all logic embedded in it.

However, do not build a plugin framework or excessive generic abstraction.

Code snippets must use the existing design system and be readable in Light and Dark mode.

Support:

- responsive layout
- safe areas
- scrolling
- increased text scaling
- long question/answer content

Do not use screenshot-specific dimensions.

---

## Answer Review

After submission show a useful engineering review.

At minimum where applicable:

- result
- explanation
- key idea

The goal is learning, not merely displaying "Correct" or "Incorrect".

Keep review content deterministic from trusted diagnostic content.

Do not call AI in this phase.

---

## Network Failure

If answer submission fails because of a transient network issue:

- keep the selected answer visible
- do not falsely show it as submitted
- allow retry
- prevent duplicate attempts

Network failure must not cause logout.

If the server confirms the answer but the client loses the response, retry/recovery
must resolve safely from server state.

---

## Logging / Privacy

Do not log complete diagnostic answers in routine request logs.

Do not log question answer keys.

Log operational failures using existing structured logging conventions.

Diagnostic responses are user data.

---

## Out of Scope

Do NOT implement:

- Starting Skill Profile
- Engineering Health calculation
- mastery scoring
- retention/decay
- personalized plan
- Today
- Learn feature
- general Practice feature
- AI-generated questions
- AI answer evaluation
- free-form reasoning evaluation
- voice
- RevenueCat
- OneSignal
- analytics platform

Do not create fake placeholders for future phases.

---

## Dependencies

Prefer existing project capabilities.

Do not add a dependency unless Phase 4 genuinely requires it.

Do not add:

- alternate state management
- assessment framework
- local database
- AI SDK
- analytics SDK
- responsive UI framework
- unnecessary utility libraries

---

## Verification

Do not create new unit, widget, integration or E2E test cases unless explicitly requested.

Run the project's existing verification needed to ensure the implementation remains healthy.

Backend:
- format
- lint
- typecheck
- existing tests
- build
- migration validation

Flutter:
- dart format
- flutter analyze
- existing tests
- Android debug build

Manual/device testing is handled separately by the product owner unless explicitly
requested.

---

## Completion Criteria

Phase 4 is development-complete when:

1. Eligible authenticated user can start a real diagnostic session.
2. Duplicate active sessions are prevented/resumed safely.
3. Questions have stable IDs/types/skill metadata.
4. Correct answers are not exposed before submission.
5. Backend is authoritative for answer evaluation.
6. User can submit an answer.
7. Optional confidence is persisted correctly.
8. Answer review displays trusted explanation/key idea.
9. Attempts persist in PostgreSQL.
10. Raw diagnostic evidence required for Phase 5 is retained.
11. User can progress through the diagnostic.
12. Application restart can resume the active diagnostic.
13. Duplicate answer submissions are safe.
14. Another user's diagnostic cannot be accessed or modified.
15. Completed diagnostic reaches the Phase 5 boundary.
16. No Starting Skill Profile is calculated yet.
17. No AI dependency is introduced.
18. Existing backend verification passes.
19. Existing Flutter verification passes.
20. Android debug build succeeds.
21. Existing project architecture remains consistent.

Manual QA remains separately pending.

---

## Documentation

Update docs/STATUS.md after successful implementation.

Change architecture documentation only if an actual durable architecture decision changed.

---

## Completion Report

Keep the report concise.

Report:

1. implemented diagnostic flow
2. database/migrations added
3. question/content model
4. API contracts added
5. important concurrency/security decisions
6. dependencies added, if any
7. backend verification results
8. Flutter verification results
9. deviations and why
10. manual QA pending
11. readiness for Phase 5

Do not begin Phase 5 automatically.

## Implementation checkpoint — 2026-09-13

Engine, persistence/migration, HTTP contracts and Flutter flow are implemented. Phase 4 remains incomplete pending the approved diagnostic catalog: questions, options, answer keys, explanations/key ideas and stable metadata. No approved content was supplied or found; start safely reports unavailable until the registry is populated. No AI-generated questions or new test cases were introduced. Existing automated verification and its coverage limits are recorded in `docs/STATUS.md`; manual QA remains separately pending. Phase 5 has not started.
