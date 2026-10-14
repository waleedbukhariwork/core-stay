# Taste

## Architecture & Code Style
- Follows SOLID pragmatically: architecture exists to control change, not to create folders; avoids ceremony interfaces and generic BaseRepository/BaseService abstractions. Confidence: 0.85
- Strongly dislikes over-engineering: no layers, packages, abstractions, or infrastructure not required by the stated acceptance criteria. Confidence: 0.85
- Wants no placeholder/future modules or empty feature folders — code and structure are added only when real functionality requires them. Confidence: 0.9
- Explicit API contracts: request/response DTOs, explicit mapping/serialization, never return database rows directly, keep the ORM out of controllers and client-facing contracts. Confidence: 0.8
- Comments should explain non-obvious WHY only; no generated-looking or self-explanatory comments. Confidence: 0.85
- Small, cohesive, reasonably sized files; split by responsibility when a file grows. Confidence: 0.75
- Prefers typed, validated, centralized configuration validated at startup (fail fast in production) rather than scattered environment access. Confidence: 0.8
- Pessimistic about adding dependencies: prefers reusing existing infrastructure over adding new libraries (e.g., class-validator over Joi). Confidence: 0.8
- Prefers stable released dependency versions and pins exact versions; avoids prerelease/RC packages. Confidence: 0.8

## Stack & Tooling
- Flutter architecture: feature-first + Riverpod (Notifier/AsyncNotifier, optionally codegen) + repository/service boundaries + MVVM-style presentation; explicitly no ChangeNotifier, StateNotifier, BLoC, or GetX. Confidence: 0.85
- Prefers a simple monorepo using plain workspace tooling (pnpm workspaces); no Nx, Turborepo, or Melos. Confidence: 0.8
- Modular monolith backend with a small initial structure rather than premature module sprawl. Confidence: 0.75
- Error responses follow Problem Details/RFC 9457 principles (type/title/status/code/requestId/detail/field errors) and never leak stack traces, SQL, internal exceptions, or secrets. Confidence: 0.8
- Structured, production-suited logging with request/correlation IDs and operational metadata; never logs bodies, credentials, or tokens globally. Confidence: 0.8
- Security baseline: never commit secrets, provide safe `.env.example` only, treat anything compiled into a mobile app as public. Confidence: 0.85
- Writing tests: wants meaningful minimum tests, explicitly does not chase coverage percentages. Confidence: 0.8
- Documentation should be concise and durable — explicit "do not generate essays". Confidence: 0.8

## Workflow & Communication
- Prefers autonomous execution: inspect once, make a concise plan, then implement the whole slice without repeatedly stopping for approval; only pause for true product decisions, security ambiguities, destructive operations, architecture conflicts with the spec, or dependency choices that need a real commitment. Confidence: 0.8
- Wants a concise final completion report covering: what was built, key architecture decisions, dependency versions chosen, tests/checks run and results, manual/device verification, anything not verified, remaining risks, and recommended next step. Confidence: 0.75
- Git commits should read like a human wrote them, with no AI co-author trailer/attribution. Confidence: 0.8
