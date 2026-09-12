# Engineering

## Naming

- TypeScript: PascalCase types, camelCase values, kebab-case files except Nest conventions (`*.module.ts`, `*.service.ts`)
- Dart: `snake_case` files, PascalCase types
- API packages: `@codecore/api`
- Flutter package: `codecore_mobile`

## File responsibility

One meaningful responsibility per file. Split when a file grows because it owns multiple jobs, not because of line-count ceremony. Feature constants live with the feature. Global constants exist only when they are actually global.

Backend HTTP adapters use `transport/http/dto/` for request and response definitions, `*-response.mapper.ts` for explicit response construction, and `*-error.mapper.ts` for failure translation. Keep requests separate from response definitions; related classes can share a focused file. Controllers retain routes, actor/input extraction and response-envelope selection. DTO declarations do not provide runtime field filtering; mappers must select public fields explicitly.

Application input/result contracts are plain TypeScript types, colocated with the cohesive service or owning domain when small. Distinguish accepted updates from nullable stored state. Avoid copying structurally identical inputs solely to introduce another layer. Keep persistence and SDK dependencies behind focused ports.

Layer depth follows behavior: Identity coordinates transactions across repositories; Profile authorizes and validates before a single atomic persistence operation; Health invokes its application-owned probe contract directly from its controller. Remove forwarding-only services instead of giving every capability identical scaffolding. This does not permit controllers to import infrastructure or bypass resource authorization. See ADR 0008.

## Comments

Comments explain non-obvious why. Do not narrate what the code already says.

## Quality gates

Backend: format, lint, architecture boundaries, full typecheck, unit/HTTP tests, applicable PostgreSQL integration and migration checks, build.

Flutter: `dart format`, `flutter analyze`, `flutter test`. Android debug build is part of Phase 0 verification. iOS runtime verification happens on macOS later.

## Dependencies

Add a package when the current slice needs it. Do not introduce Nx, Turborepo, Melos, Redis, queues, or UI kits in Phase 0. Pin `packageManager` in the root manifest. Keep Drizzle on the stable `0.45.x` line; do not take 1.0 prereleases.


## Backend architecture rules

These rules refine the existing controller/service/repository convention. Current ownership and deliberate exceptions are recorded in `ARCHITECTURE.md` and ADR 0007; they do not authorize new product features.

1. Organize business code by capability; use consistent structures for comparable modules and fewer layers for simple slices.
2. Preserve external methods, paths, DTO validation, responses, errors, token/session semantics and integration contracts unless an intentional change is authorized.
3. Separate transport validation/mapping, application orchestration/resource policies, pure domain rules and infrastructure adapters.
4. Keep domain independent of Nest, HTTP, persistence and SDKs. Application may use Nest DI, not HTTP or database implementations.
5. Expose deliberate plain public module APIs; other modules must not import private services, repositories or tables.
6. Keep dependencies acyclic. Assign genuine cross-module coordination to an explicit workflow; do not hide cycles in shared code or `forwardRef()`.
7. Keep Drizzle, schemas, SQL and PostgreSQL behavior in owning persistence adapters or platform database infrastructure.
8. Use focused contracts and cohesive services where they control change. Avoid pass-through layers, generic base repositories and an interface for every class.
9. Let the use case/workflow own atomic boundaries. All participating writes must use one explicit transaction connection; never independently commit pieces or fall back to the pool.
10. Enforce applicable invariants with constraints and concurrency-safe operations. Preserve lock order, isolation, conditional writes and commit-before-error semantics; retry only when safe.
11. Derive actors from verified credentials and assert resource ownership/tenant access at the application boundary. Guards alone are insufficient; workers need explicit execution identities and current authorization.
12. Keep API/event contracts independent of database models; map responses explicitly and exclude credentials and sensitive fields. Validate untrusted messages at runtime.
13. Use durable delivery, idempotent consumption and explicit ordering when asynchronous business effects require them. Document transaction/external-side-effect limitations; do not introduce an outbox universally.
14. Preserve request correlation and useful observability while redacting bodies, secrets, tokens, hashes, provider internals and sensitive data.
15. Use reviewed, data-aware SQL migrations. Never casually rewrite applied migrations, reset data, or use destructive schema synchronization to simplify refactoring.
16. Test meaningful contracts, security boundaries, rollback/concurrency and database semantics with appropriate unit/HTTP/isolated PostgreSQL tests. Check query behavior for N+1 regressions.
17. Run `architecture:check` and maintain its positive/negative fixtures. Source import boundaries are enforced in CI and the regular test suite; review runtime wiring separately.
18. Record material decisions in ADRs and unavoidable database/extraction coupling in architecture docs. Remote calls do not preserve local transaction/failure semantics automatically.
19. Add infrastructure, patterns, public exports and dependencies only for concrete requirements. Keep actual configuration and integrations dynamic through typed boundaries and adapters.
20. Keep `tasks/CURRENT.md` and `docs/STATUS.md` accurate: separate baseline failures, regressions, executed checks and unverified/manual work.
21. Keep compatibility adapters thin and temporary. Remove obsolete paths only after behavior and references are verified; preserve unrelated work.
22. Prevent duplicate routes, consumers, schedules and side effects during transitions. Maintain the entry-point inventory, including non-HTTP contracts when introduced.

## Verification Policy

Coding agents are responsible for automated/code-level verification.

Unless a task explicitly requests manual verification, agents must NOT block task
completion on emulator, simulator, physical-device, visual, or other manual QA.

Required automated verification must still be performed fully, including as applicable:

- formatting
- linting/static analysis
- type checking
- unit tests
- widget/component tests
- integration tests
- application builds
- migration checks
- configuration validation
- security-relevant automated tests

Manual QA, emulator interaction, physical-device testing, visual acceptance, and
exploratory testing are performed separately by the product owner unless explicitly
requested in tasks/CURRENT.md.

Agents must clearly report what was verified automatically and what remains for manual QA.
