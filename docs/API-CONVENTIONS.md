# API conventions

Base path: `/api/v1`

## Success

Explicit response DTOs. Typical envelope:

```json
{ "data": { "status": "ok" } }
```

Only fields on the response contract are serialized. Database rows are never returned.

## Requests

Class-validator DTO classes. Global pipe:

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

The eight auth routes above plus `GET /api/v1/health` are the nine registered HTTP routes. Health returns 200 `{ "data": { "status": "ok" } }` or 503 `DATABASE_UNAVAILABLE` Problem Details when connectivity fails. Auth 204 responses have no body; there is no new universal envelope. Route registration is checked for duplicates against this inventory.

No cookies, pagination, filtering, sorting, tenant IDs or broad permission fields are part of these endpoints. DTO transforms/defaults and accepted formats remain unchanged through the architecture migration. No OpenAPI generator is installed; this document is the maintained external contract.

Non-HTTP entry points: `main.ts` boots the configured Nest app; pool shutdown closes connections; Drizzle Kit applies reviewed SQL through existing CLI scripts. There are no workers, scheduled tasks, message/event consumers, externally consumed events or webhooks. SES verification email and the gated local-file inbox are outbound side effects of register/resend, not new listeners. Their runtime configuration, message content and delivery-failure semantics are retained. Update this inventory when a real new entry point is authorized.
