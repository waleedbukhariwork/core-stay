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

## Intentionally unimplemented

Authentication, users, onboarding, diagnostic, plans, practice, AI, RevenueCat, OneSignal, analytics, Redis, queues, Terraform/AWS, voice, product schema, and placeholder feature modules.
