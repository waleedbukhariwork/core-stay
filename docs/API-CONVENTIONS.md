# API conventions

Base path: `/api/v1`

## Success

Explicit response DTOs. Typical envelope:

```json
{ "data": { "status": "ok" } }
```

HTTP response definitions live in each capability's `transport/http/dto/`; sibling `*-response.mapper.ts` functions explicitly construct responses from plain application results. Only selected public fields are serialized. DTO class annotations alone do not strip extra properties. Database rows are never returned.

## Requests

Class-validator request DTO classes live in `transport/http/dto/`, separately from response definitions. Application services accept plain input types without importing these HTTP classes. Global pipe:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

## Errors

RFC 9457-inspired Problem Details (`application/problem+json`):

| Field    | Purpose                                      |
| -------- | -------------------------------------------- |
| type     | Stable problem URI                           |
| title    | Short summary                                |
| status   | HTTP status                                  |
| code     | Machine-readable application code            |
| requestId| Correlation id                               |
| detail   | Safe human explanation, omitted if sensitive |
| errors   | Field validation issues when applicable      |

Never include stack traces, SQL, internals, credentials, or secrets.

## Versioning

Breaking HTTP changes require a new `/api/vN` prefix. Additive fields on existing contracts are allowed.

## Authentication (Phase 2)

All paths below are under `/api/v1`; auth responses set `Cache-Control: no-store`.

| Method/path | Request | Success |
| --- | --- | --- |
| POST `/auth/register` | `email`, `password` | 202 verification metadata |
| POST `/auth/email-verification/verify` | `email`, six-digit `code` string | 200 token pair + user |
| POST `/auth/email-verification/resend` | `email` | 202 verification metadata |
| POST `/auth/login` | `email`, `password` | 200 token pair + user |
| POST `/auth/refresh` | opaque `refreshToken` | 200 replacement token pair + user |
| POST `/auth/logout` | Bearer access token; no body | 204 |
| POST `/auth/logout-all` | Bearer access token; no body | 204 |
| GET `/auth/me` | Bearer access token | 200 user |

Verification metadata: `{ "data": { "status": "awaitingEmailVerification", "resendAfter": 60, "expiresIn": 600 } }`.

Token pair: `{ "data": { "accessToken": "…", "refreshToken": "…", "expiresIn": 600, "user": { "id": "UUID", "email": "…", "emailVerified": true, "status": "active" } } }`.

`/auth/me` wraps just those four user fields in `data`. Credentials, challenge digests, token hashes and database metadata are never response fields. Refresh tokens are opaque, 43-character base64url strings; clients must replace them after every successful refresh.

Errors use the existing Problem Details contract:

- 401: `INVALID_CREDENTIALS`, `ACCESS_TOKEN_INVALID`, `ACCESS_TOKEN_EXPIRED`, `REFRESH_TOKEN_INVALID`, `SESSION_EXPIRED`, `SESSION_REVOKED`.
- 403: `EMAIL_NOT_VERIFIED` (only after password validation).
- 409: `ACCOUNT_ALREADY_EXISTS`, `REGISTRATION_PENDING` (matching pending password only; resume verification with unchanged credentials).
- 400: `VERIFICATION_INVALID`, `VERIFICATION_EXPIRED`, `VERIFICATION_ATTEMPTS_EXCEEDED` on the fifth failed guess, or existing DTO validation errors.
- 429: `VERIFICATION_ATTEMPTS_EXCEEDED` for an already locked challenge, `VERIFICATION_RESEND_TOO_SOON`, `RATE_LIMITED` (with `Retry-After` for a full existing rate bucket).
- 503: `EMAIL_DELIVERY_UNAVAILABLE`.

Unknown/verified resend returns the same accepted metadata without sending a message. A current pending challenge can expose cooldown errors. Registration intentionally reveals duplicates; login does not distinguish unknown identity from incorrect password. Expired access JWTs alone trigger mobile refresh; other errors are not automatically retried.

No Swagger layer existed in Phase 0; this endpoint contract remains the API documentation.

## Complete entry-point inventory

The eight auth routes above, three profile routes below, and `GET /api/v1/health` are the twelve registered HTTP routes. Health returns 200 `{ "data": { "status": "ok" } }` or 503 `DATABASE_UNAVAILABLE` Problem Details when connectivity fails. Auth 204 responses have no body; there is no new universal envelope. Route registration is checked for duplicates against this inventory.

No cookies, pagination, filtering, sorting, tenant IDs or broad permission fields are part of these endpoints. DTO transforms/defaults and accepted formats remain unchanged through the architecture migration. No OpenAPI generator is installed; this document is the maintained external contract.

Non-HTTP entry points: `main.ts` boots the configured Nest app; pool shutdown closes connections; Drizzle Kit applies reviewed SQL through existing CLI scripts. There are no workers, scheduled tasks, message/event consumers, externally consumed events or webhooks. SES verification email and the gated local-file inbox are outbound side effects of register/resend, not new listeners. Their runtime configuration, message content and delivery-failure semantics are retained. Update this inventory when a real new entry point is authorized.

## Engineering profile (Phase 3)

All three routes require a Bearer access token and an active verified account with a live session, including catalog reads. Responses use `Cache-Control: no-store`. There is no user ID in the path, query contract, or request body.

| Method/path | Request | Success |
| --- | --- | --- |
| GET `/profile/catalog` | No body | 200 `{ "data": { "goals": [...], "role": [...], "experience": [...], "technologies": [...], "focusAreas": [...], "dailyMinutes": [...], "learningPreferences": [...] } }` |
| GET `/profile` | No body | 200 current preferences, status and next step |
| PATCH `/profile` | One or more supported preference fields | 200 complete current profile response after atomic replacement of supplied fields |

Each catalog option has `id`, `label`, `enabled`, `order`, nullable `category`, nullable `exclusiveGroup`, and `recommended`. All IDs are strings except daily time IDs, which are integer minutes. `primary_approach` is the shared exclusive group for challenge-first and explain-first; selecting either replaces the other in Flutter. Other learning preferences coexist. At least one learning preference is required; selecting a primary approach is optional. Ten minutes is visually recommended, never silently saved or preselected. No focus-area preselection is introduced.

A new profile returns:

```json
{
  "data": {
    "preferences": {
      "goals": null,
      "role": null,
      "experience": null,
      "technologies": null,
      "focusAreas": null,
      "dailyMinutes": null,
      "learningPreferences": null
    },
    "status": "not_started",
    "nextStep": "goals"
  }
}
```

For example, `PATCH /profile` with `{ "goals": ["stay_current", "fundamentals"] }` returns those persisted goals and `nextStep: "role"`. Multi-select values replace the whole supplied field and are returned in catalog order. Omitted fields are retained. Null, empty selections, duplicate IDs, unknown/disabled IDs, incompatible preferences, unknown properties and an empty update object are rejected. There is no clear/reset operation in this phase. Daily time accepts only integer 5, 10 or 15; role and experience use catalog string IDs.

`status` is `not_started`, `in_progress`, or `complete`. `nextStep` is the first invalid/missing field in this order: `goals`, `role`, `experience`, `technologies`, `focusAreas`, `dailyMinutes`, `learningPreferences`; otherwise it is `DIAGNOSTIC`. No diagnostic or general-onboarding completion flag is set. Responses omit ownership IDs, database IDs and timestamps.

## Diagnostic (Phase 4)

All four endpoints require verified active authentication, a live owned Identity session and a complete engineering profile. They use the existing `data` envelope, Problem Details validation/errors and `Cache-Control: no-store`. They never accept user/session ownership IDs. The initial catalog awaits approved content; starting before publication returns 503 `DIAGNOSTIC_UNAVAILABLE` and writes nothing.

| Method/path (under `/api/v1`) | Input | Result |
| --- | --- | --- |
| `GET /diagnostic` | None | 200, `data: null` if never started, otherwise current server state |
| `POST /diagnostic` | None | 200, start or resume; completed diagnostics stay completed |
| `POST /diagnostic/answers` | `questionId`, `selectedOptionId`, optional integer `responseDurationMs` (0–86,400,000) | 200, saved progress and confidence request or review |
| `PATCH /diagnostic/confidence` | `questionId`, `confidence`: `guessing`, `somewhat_sure`, `very_sure` | 200, saved progress and trusted review |

State exposes `status` (`active`/`completed`), `diagnosticId`, `version`, ISO `startedAt`/nullable `completedAt`, `progress: { answered, total }`, nullable `question`, nullable `confidence: { question, selectedOptionId }`, and nullable `review`. Questions expose stable `id`, `category`, `interactionType`, public `skill`/`concept` IDs and labels, `prompt`, nullable `context`/`code`, options `{ id, label }` and `confidenceRequested`. Review alone exposes `correct`, `correctOptionId`, `explanation`, `keyIdea`, semantic `confidence`, the answered question and `selectedOptionId`. No raw rows, hidden keys or scoring implementation fields are serialized.

`GET` resumes at the next unanswered question, except that unfinished configured confidence must be recorded first. It returns no historical review. The client shows the review returned by submission, then obtains fresh state to continue; there is no endpoint for merely dismissing a review. The final answer or required confidence write completes the session, and its response still includes the final review.

An identical answer retry returns the original evidence and does not overwrite duration or answered time, even after completion. A different answer to an attempted question returns 409 `DIAGNOSTIC_ANSWER_CONFLICT`. New writes to completed sessions reject with 409 `DIAGNOSTIC_COMPLETED`. Confidence can be updated for the latest answered question while active; exact confidence retries are reads and remain safe after completion. Confidence on unconfigured/unanswered questions rejects with 400 `INVALID_DIAGNOSTIC_CONFIDENCE`. Other failures include 403 `PROFILE_INCOMPLETE`, 409 `DIAGNOSTIC_NOT_STARTED`, 409 `DIAGNOSTIC_QUESTION_OUT_OF_ORDER` and 400 `INVALID_DIAGNOSTIC_ANSWER`; unknown/null/malformed DTO fields retain existing validation errors. Response duration is untrusted client evidence, not an authoritative measure of ability.

Validation returns 400 `VALIDATION_ERROR` for DTO failures or 400 `INVALID_PREFERENCES` for domain/update compatibility failures. Authentication uses the existing 401 codes. The mobile client validates the catalog and response shape and checks that progress agrees with saved information; malformed responses offer recovery and cannot advance to Diagnostic Intro. Failed saves retain current selections and can be safely repeated. Same-field concurrent changes use last committed replacement; different-field updates are preserved.
