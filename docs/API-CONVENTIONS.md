# API conventions

Base path: `/api/v1`

## Success

Explicit response DTOs. Typical envelope:

```json
{ "data": { "status": "ok" } }
```

Only fields on the response contract are serialized. Database rows are never returned.

## Requests

Class-validator DTO classes. Global pipe:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

## Errors

RFC 9457-inspired Problem Details (`application/problem+json`):

| Field    | Purpose                                      |
| -------- | -------------------------------------------- |
| type     | Stable problem URI                           |
| title    | Short summary                                |
| status   | HTTP status                                  |
| code     | Machine-readable application code            |
| requestId| Correlation id                               |
| detail   | Safe human explanation, omitted if sensitive |
| errors   | Field validation issues when applicable      |

Never include stack traces, SQL, internals, credentials, or secrets.

## Versioning

Breaking HTTP changes require a new `/api/vN` prefix. Additive fields on existing contracts are allowed.
