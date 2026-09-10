# Security

## Configuration and transport

Secrets belong in validated server configuration, never git or Flutter defines. Both auth secrets are required, independent base64 values encoding at least 32 random bytes (`openssl rand -base64 32`, run separately). Issuer and audience are required. Missing configuration fails startup in every environment. `.env.example` contains names, not auth secrets.

Use TLS at the deployment ingress. Flutter requires HTTPS outside `local`, refuses credential-bearing base URLs, disables auth redirects, and rejects authenticated requests to another origin. Do not log request bodies, query strings, Authorization headers, passwords, codes, hashes, or token pairs. Error logs contain only requestId, application code, and exception category.

## Identity and passwords

Identity owns accounts, credentials, challenges, sessions and all five persistence tables. Email comparison trims and lowercases the entire address; display email retains casing. No dot/plus-alias rewriting. PostgreSQL enforces unique normalized email. Pending registration returns `REGISTRATION_PENDING` only when the submitted password matches, without changing credentials; a different password returns `ACCOUNT_ALREADY_EXISTS` to avoid activating a pre-registered credential the caller did not choose; verified duplicates return `ACCOUNT_ALREADY_EXISTS`. A simultaneous insert loser receives `ACCOUNT_ALREADY_EXISTS` from the unique constraint.

Passwords allow 12–128 Unicode characters, including spaces, without composition rules. Argon2id uses 64 MiB, three iterations, one lane, a random salt and 32-byte output. Parameters live in `auth-policy.ts`; benchmark before increasing concurrency or changing them. This exceeds the [OWASP Argon2id minimum](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id). Hashes stay inside Identity infrastructure. Unknown-email login performs a dummy Argon2 verification; unknown/wrong/disabled credentials share `INVALID_CREDENTIALS`. Only a correct password can reveal `EMAIL_NOT_VERIFIED`.

## Email verification and delivery

Six cryptographically random digits; HMAC-SHA-256 binds the challenge ID and code to an independent server secret. Expiry: 10 minutes; attempts: five; resend cooldown: 60 seconds. One current challenge per user is replaced on resend, invalidating prior challenge material. Verification consumes it and creates the verified identity/session in one transaction. Failed attempts commit even though the request fails.

`EmailSender` isolates business logic from SES v2. Non-local environments require SES, an explicit sender and AWS region. The AWS SDK uses its default credential chain; production should use a least-privilege workload role with `ses:SendEmail` for the approved sender. SES identity verification, region/sandbox access and delivery monitoring remain deployment configuration, not provisions in this phase.

`AUTH_EMAIL_MODE=file` is accepted **only** with `APP_ENV=local`. It writes development messages to `/tmp/codecore-email-inbox` (directory 0700, files 0600); nothing exposes codes over HTTP or logs them. Remove local messages when no longer needed. Tests replace the sender and never send real email.

Registration and resend await bounded email delivery inside their database transaction. A reported delivery failure rolls back every related write. Email and PostgreSQL cannot commit atomically: an accepted email followed by a database failure can contain an unusable code. Retrying registration/resend recovers. See [ADR 0006](adr/0006-auth-transactions-and-sessions.md).

## Sessions and tokens

Access JWT: HS256, 10 minutes, exact algorithm/signature/issuer/audience/expiry validation; only `sub`, `sid`, `iss`, `aud`, `iat`, `exp`. Signing mechanics are isolated in `TokenService`. Never use an access JWT as a refresh token.

Refresh tokens contain 256 random bits; only SHA-256 digests are persisted. Sessions have a fixed 30-day lifetime, not a sliding lifetime. Each refresh transaction consumes the current token and writes its replacement. Consumed-token reuse revokes the entire affected session before returning `SESSION_REVOKED`; other sessions remain usable. Keep consumed rows at least through session expiry to retain reuse evidence. No automatic retention worker is introduced.

Database lock order is user → session/challenge. Row locks serialize verification, resend, rotation and revocation. Logout revokes the current session; logout-all revokes all that user's sessions serialized before it. A later successful login can establish a new session. `/auth/me` checks active user and session state, giving immediate revocation for that endpoint. Future protected use cases must choose whether JWT validity alone or a live session check is appropriate. There is no Redis blacklist.

Application calls require a verified actor, not a client-supplied ID or a structurally matching object. `IdentityApi.authenticate` creates an immutable process-local actor and `assertAuthenticated` checks provenance and credential expiry; owning application policies check the locked resource's user/session IDs. The migration closes the previous internal plain-principal trust gap and adds explicit logout ownership checks. It does not introduce a new HTTP authentication flow. A copied/deserialized actor must be authenticated again from verified credentials. Resource-owning modules must enforce their own policies; identity does not grant arbitrary business permissions.

Repeated logout remains successful with a still-valid access JWT, including from a revoked/expired server session; logout-all may therefore revoke remaining sessions from that credential. `/auth/me` still rejects revoked/expired sessions. No tenant, role, service-actor or background execution model currently exists. Define and validate those identities if such entry points are introduced. See [ADR 0007](adr/0007-identity-modular-boundaries.md).

## Mobile session handling

Only refresh material persists through `flutter_secure_storage`; access tokens remain in memory. Android backup is disabled; iOS Keychain uses device-only accessibility and configured entitlements. Follow the [storage package's platform requirements](https://pub.dev/packages/flutter_secure_storage).

Startup refreshes the saved token. Riverpod owns the routing state. A dedicated unauthenticated client performs refresh; the authenticated Dio interceptor shares one refresh future, handles late stale 401s, and retries an eligible request once only for `ACCESS_TOKEN_EXPIRED`. Streams/multipart requests are not replayed automatically.

Confirmed session rejection clears secure state. Network/server errors preserve it and offer retry. Secure writes/deletes are serialized, and a generation check prevents in-flight refresh from restoring a logged-out session. A failed secure write retains the replacement in memory and retries persistence without another rotation. A failed delete must succeed before returning to unauthenticated state. Offline logout reports failure and preserves the session for a retry.

Strict rotation deliberately has no reuse grace window. If the server commits a refresh but its response is lost, a later retry of the saved old token revokes the family and requires sign-in. A crash between receiving a rotated token and securely saving it has the same limitation; transient network failure itself never deletes credentials.

## Abuse controls and deployment boundary

Auth HTTP endpoints have bounded process-local per-peer/per-endpoint throttling (20 requests/minute). Verification attempts and resend cooldown are authoritative in PostgreSQL. Forwarded IP headers are not trusted. Before horizontally scaled production, configure AWS edge/distributed rate limiting and an explicitly trusted ingress/proxy topology; this limiter is **not** globally distributed. Load-test Argon2 CPU/memory and SES latency before setting production instance concurrency.

Automated tests cover cryptography, serialization, logging, configuration, storage failure, real PostgreSQL constraints/rollback, concurrent verification/rotation/revocation and mobile refresh coordination. Manual device/visual QA and a live SES delivery check remain separately pending.
