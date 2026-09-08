# AGENTS

This repository is CodeCore. Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/ENGINEERING.md`, and `tasks/CURRENT.md` before changing behavior.

## Layout

- `apps/api` — NestJS modular monolith
- `apps/mobile` — Flutter (Android + iOS), managed by the Flutter toolchain, not pnpm
- `infra/docker` — local development only
- `docs/` — durable product and engineering docs

## Rules

- Follow SOLID pragmatically. Architecture exists to control change.
- Controllers: HTTP only. Services: use cases. Repositories: persistence.
- Do not leak Drizzle into controllers or Flutter-facing contracts.
- Do not add auth, users, practice, AI, Redis, Terraform, or empty feature modules.
- Do not introduce Nx, Turborepo, or Melos.
- Do not scatter environment URLs or secrets.
- Comments explain non-obvious why only.

Phase 0 quality: API format/lint/typecheck/test/build; Flutter format/analyze/test; no secrets in git.
