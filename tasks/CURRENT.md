# Current

Backend architecture migration after Phase 2 is complete. Scope: backend and durable documentation; existing API contracts, PostgreSQL data/migrations, runtime configuration, SES/local email integration and Flutter behavior are retained.

Completed: baseline/contract characterization → platform and Health vertical slice → consolidated Identity with application-owned transactions, pure domain policies/failures and verified actor/resource authorization → automated import/cycle and route checks → final compatibility, PostgreSQL, migration and build verification → permanent documentation rules and ADR 0007.

Final checks: 69 unit/HTTP/architecture tests and 35 isolated PostgreSQL integration tests pass; API format/lint/full typecheck/build and migration checks pass. Detailed evidence, scope of protected-file checks and remaining operational/manual verification are in `docs/STATUS.md`. Current architecture and all 22 permanent rules are in `docs/ARCHITECTURE.md` and `docs/ENGINEERING.md`.

No significant migration implementation remains. Phase 3 has not started. Manual QA, live SES and deployment checks remain separately owned as documented; no production deployment or destructive application-database operations were performed.
