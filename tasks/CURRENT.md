# Phase 4A — Diagnostic Content Activation

## Goal

Activate the existing Phase 4 diagnostic engine with the first approved,
versioned diagnostic catalog.

Follow the existing current architecture of the project consistently for both
frontend and backend.

Do not introduce a parallel architecture or restructure the existing architecture
unless genuinely required.

Do not create new test cases unless explicitly requested.

---

## Current State

The diagnostic engine, persistence, API contracts and Flutter flow already exist.

The diagnostic catalog is intentionally empty, causing:

503 DIAGNOSTIC_UNAVAILABLE

This task must populate and activate the approved diagnostic content without
redesigning the diagnostic engine.

---

## Diagnostic Version

Create the first immutable diagnostic definition using the project's existing
versioning conventions.

Suggested semantic identity:

engineering-baseline-v1

Do not silently mutate the meaning of an existing diagnostic version after it is used.

---

## Initial Diagnostic

Target:

- approximately 8 questions
- approximately 5–7 minutes
- engineering judgment rather than trivia

Initial composition:

- 5 general engineering questions
- 3 role-relevant questions where supported cleanly by the existing diagnostic architecture

If the current engine does not yet support safe role-based selection without a
structural redesign, activate a high-quality general engineering baseline first
rather than adding unnecessary architecture.

---

## Skills

The first baseline should cover a useful spread such as:

- Debugging / problem solving
- API / HTTP reasoning
- Databases
- Security
- Concurrency / system behavior
- Performance / reliability where appropriate

Avoid questions that only test syntax memorization.

---

## Interaction Types

Use interaction types already supported by Phase 4.

Prefer a balanced mix of:

- Scenario Judgment
- Spot the Bug
- Predict Outcome
- Better Approach
- Conceptual Reasoning

Do not introduce a new renderer/interactivity model unless actually required by
the approved questions.

---

## Difficulty

Use a balanced first diagnostic.

Suggested distribution:

- 2 foundational
- 4 intermediate
- 2 advanced/intermediate-advanced

Difficulty should represent engineering reasoning, not obscure trivia.

---

## Question Content Requirements

Every question must have:

- stable ID
- diagnostic version
- interaction type
- stable skill identifier
- stable concept identifier
- difficulty
- prompt
- any required code/context
- answer options
- authoritative correct answer
- concise explanation
- key idea
- confidence-enabled flag where appropriate

Use the existing diagnostic catalog/domain model.

Do not redesign it merely to match this list if equivalent concepts already exist.

---

## Question Quality

Questions must test practical engineering judgment.

Avoid:

- definition trivia
- obscure syntax trivia
- trick questions
- ambiguous "best" answers without sufficient context
- framework-version trivia unless the version is explicit

Each question must have one defensible expected answer under the stated assumptions.

Explanations must explain WHY.

---

## Confidence

Enable confidence only where it adds useful evidence.

Use the existing confidence values.

Suggested use: approximately 3 questions.

Do not enable confidence mechanically for every question.

---

## Security

Preserve existing Phase 4 behavior:

- answer keys are never sent before submission
- scoring remains backend-authoritative
- Flutter does not contain hidden correct answers
- another user cannot access another diagnostic
- diagnostic answers are not logged unnecessarily

---

## Phase Boundary

This task ends when the real diagnostic can be completed.

Do NOT implement:

- Starting Skill Profile
- Engineering Health
- mastery formulas
- personalized plan
- Today
- AI-generated questions
- AI answer evaluation
- voice
- RevenueCat
- OneSignal

---

## Verification

Do not create new test cases unless explicitly requested.

Run existing project verification:

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

Also perform any existing catalog/schema validation required by the project.

Manual/device testing remains separate.

---

## Completion Criteria

Phase 4A is complete when:

1. Diagnostic catalog is no longer empty.
2. DIAGNOSTIC_UNAVAILABLE is no longer returned for an eligible user.
3. A real diagnostic session can start.
4. Real questions can be answered.
5. Correct answers remain hidden before submission.
6. Trusted answer review/explanations are returned after submission.
7. Confidence works on configured questions.
8. Full diagnostic can reach completed state.
9. Diagnostic version is stable and explicit.
10. Raw evidence required for Phase 5 is persisted.
11. Existing backend verification passes.
12. Existing Flutter verification passes.
13. Android debug build succeeds.
14. Existing architecture remains unchanged unless genuinely required.

Do not begin Phase 5 automatically.

---

## Completion Report

Report briefly:

1. diagnostic version
2. number of questions
3. skills/concepts covered
4. interaction/difficulty distribution
5. confidence-enabled questions
6. backend verification
7. Flutter verification
8. any deviations
9. readiness for Phase 5