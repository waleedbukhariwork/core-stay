# ADR-0004: Flutter feature-first Riverpod

## Status

Accepted

## Context

The mobile app must stay testable and adaptive across Android and iOS without a third-party UI kit.

## Decision

Use Flutter stable, feature-first folders, Riverpod 3 (`Notifier` / `AsyncNotifier`), go_router, and Dio. Presentation follows MVVM-style notifiers. Network providers disable automatic retry; the UI retries explicitly.

## Consequences

No BLoC, GetX, Freezed, or secure storage in Phase 0. Theme tokens live in `lib/app/theme`. The Health feature is the first end-to-end proof.
