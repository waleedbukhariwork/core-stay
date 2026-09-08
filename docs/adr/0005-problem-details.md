# ADR-0005: Problem Details errors

## Status

Accepted

## Context

Clients need a stable failure contract. Stack traces and SQL must never leave the process.

## Decision

Map all HTTP failures to a small RFC 9457-inspired Problem Details body with `type`, `title`, `status`, `code`, `requestId`, optional safe `detail`, and optional field `errors`.

## Consequences

One exception filter owns the mapping. Unknown errors become a generic 500 without internals.
