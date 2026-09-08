# Architecture

CodeCore is a deployment-independent modular monolith: one NestJS API and one Flutter app. AWS comes later; application code must not assume a specific host.

## Backend

- Modular monolith under `apps/api`
- HTTP adapters in controllers
- Application services coordinate use cases
- Repositories own persistence
- Drizzle stays behind the persistence boundary
- Controllers return mapped response DTOs, never database rows

Initial modules: shared `common/*` plus `health`. Feature modules are created when they have real behavior.

Depend on an abstraction only when replacement is realistic. Do not add generic `BaseRepository` / `BaseService` types. Domain, use-case, and facade layers are justified when a feature has multiple entry points, non-trivial policy, or a persistence model that diverges from the API contract. Until then, keep the path short: controller → service → repository.

## Flutter

Feature-first layout with Riverpod 3, repository/service boundaries, and MVVM-style presentation.

- `lib/app` — composition, routing, theme
- `lib/core` — config, errors, network, shared widgets
- `lib/features/<name>` — data, presentation, and feature types together

Widgets depend on repositories/notifiers, not Dio. Network providers disable Riverpod's default automatic retry; the UI owns retry.

## Environments

Both API and mobile support `local`, `dev`, `staging`, and `production`.

Configuration is loaded and validated at a single boundary. Feature code reads typed config, never raw environment maps. Values compiled into Flutter are public.

Local Android emulator traffic uses `10.0.2.2` to reach the host API.

## Persistence

PostgreSQL + Drizzle ORM (`0.45.x`) + `pg`. Schema files are aggregated from feature files as tables appear. Phase 0 has no product tables; the schema barrel and migration tooling exist so the first feature can add them without restructuring.
