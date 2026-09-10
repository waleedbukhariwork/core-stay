# Local API

Use the repository README for the base toolchain and Docker setup.

For Phase 2, copy `.env.example` to `.env` if needed. Generate **two independent** values with `openssl rand -base64 32` and set `AUTH_JWT_SECRET` and `AUTH_VERIFICATION_SECRET`. Keep them in the ignored `.env`. Issuer/audience and `AUTH_EMAIL_MODE=file` are in the example. Startup intentionally fails without the required auth configuration.

Run `pnpm --filter @codecore/api db:migrate` with `DATABASE_URL` pointing at local CodeCore Postgres, then `pnpm api:dev`. Drizzle Kit reads the API `.env` (shell values take precedence); local Compose uses port 55432. Local verification messages appear in `/tmp/codecore-email-inbox`; open the newest message for the registered email. They are development-only files, never an HTTP response or production log.

`pnpm --filter @codecore/api test` runs unit/HTTP tests without PostgreSQL. `TEST_DATABASE_URL=… pnpm --filter @codecore/api test:integration` requires a local/CI PostgreSQL account with CREATEDB permission; it creates a unique test database, applies the real migration twice, exercises transactions/HTTP, and removes only that database afterward. Tests use a fake sender and require no AWS credentials.

See `docs/API-CONVENTIONS.md` for endpoints and `docs/SECURITY.md` for session and deployment behavior.

Backend ownership and layers are documented in `docs/ARCHITECTURE.md` and ADR 0007. `identity` owns accounts/authentication/sessions, `health` owns connectivity, and `platform` holds technical infrastructure. Run `pnpm --filter @codecore/api architecture:check` to check source boundaries; it also runs in the regular test suite and CI. The migration path remains `apps/api/drizzle`; only the source schema catalog moved to `src/platform/database/schema.ts`.
