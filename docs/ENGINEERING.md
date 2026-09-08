# Engineering

## Naming

- TypeScript: PascalCase types, camelCase values, kebab-case files except Nest conventions (`*.module.ts`, `*.service.ts`)
- Dart: `snake_case` files, PascalCase types
- API packages: `@codecore/api`
- Flutter package: `codecore_mobile`

## File responsibility

One meaningful responsibility per file. Split when a file grows because it owns multiple jobs, not because of line-count ceremony. Feature constants live with the feature. Global constants exist only when they are actually global.

## Comments

Comments explain non-obvious why. Do not narrate what the code already says.

## Quality gates

Backend: format, lint, typecheck, tests, build.

Flutter: `dart format`, `flutter analyze`, `flutter test`. Android debug build is part of Phase 0 verification. iOS runtime verification happens on macOS later.

## Dependencies

Add a package when the current slice needs it. Do not introduce Nx, Turborepo, Melos, Redis, queues, or UI kits in Phase 0. Pin `packageManager` in the root manifest. Keep Drizzle on the stable `0.45.x` line; do not take 1.0 prereleases.
