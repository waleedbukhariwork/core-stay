# Security

## Secrets

- Never commit real secrets
- `.env` is gitignored; only `.env.example` with disposable local values is committed
- Local Docker Postgres credentials are for local development only
- Production must fail startup if required configuration is missing

## Logging

- Structured logs in non-local environments
- Request logs include requestId, method, path, status, duration
- Do not log request bodies globally
- Never log passwords, Authorization headers, tokens, API keys, or secrets

## Mobile

Anything compiled into the Flutter app is public. No API secrets in the client. Phase 0 talks to a public health endpoint only.

## Current baseline

- Validated configuration at boot
- Explicit HTTP contracts
- Problem Details without internal leakage
- Request correlation ids
- Database connectivity check without exposing connection details
- No authentication, rate limiting, WAF, or cloud IAM in this slice
