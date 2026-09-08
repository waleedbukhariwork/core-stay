# ADR-0001: Simple pnpm workspace

## Status

Accepted

## Context

CodeCore needs one API and one Flutter app in a single repository without a heavy monorepo framework.

## Decision

Use a pnpm workspace for Node packages only. Flutter stays a standard app under `apps/mobile`. Do not introduce Nx, Turborepo, or Melos.

## Consequences

Shared Node tooling lives at the repo root. Flutter uses its own toolchain and CI job.
