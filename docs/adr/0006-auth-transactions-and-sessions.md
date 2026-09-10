# 0006 — Auth transaction boundaries and rotating sessions

Status: accepted, Phase 2. Ownership/facade arrangement superseded by [ADR 0007](0007-identity-modular-boundaries.md); transaction, session and email-delivery decisions retained. The following records the original Phase 2 arrangement.

Auth uses one PostgreSQL unit of work with a Users-owned identity writer. `UsersFacade` is the public application boundary; only infrastructure composes Drizzle transaction adapters. Registration, verification/session creation, refresh rotation and revocation therefore share real database transactions without leaking Drizzle into services or HTTP contracts.

Operations lock the user before its challenge/session. Refresh rereads the token after acquiring those locks. Reuse and incorrect-code attempts return an error value from the transaction and throw after commit, preserving the revocation/attempt write. Refresh families use server-side sessions with a fixed expiry, opaque rotating secrets and retained consumed-token digests. There is no reuse grace period; an ambiguous lost response may require sign-in.

Email delivery runs inside registration/resend transactions with a bounded SES call. This avoids inconsistent identities on reported delivery failure without adding an outbox or queue now. Email acceptance followed by database failure can still yield an unusable email: external delivery is not transactionally atomic. Registration/resend is the recovery path. Introduce an outbox only when delivery guarantees or throughput justify that operational component.
