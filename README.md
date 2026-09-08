# CodeCore

Mobile-first practice for engineers who want to stay current, stay sharp, and keep progressing.

Learn → Practice → Review → Reinforce → Track. AI is intelligence inside that loop, not the headline.

## Layout

```
apps/api       NestJS API (pnpm workspace)
apps/mobile    Flutter (Android + iOS)
infra/docker   Local Postgres only
docs/          Product and engineering docs
```

## Prerequisites

- Node 24 LTS
- pnpm 11.21.0 (pinned in `package.json`)
- Flutter stable (3.47.x)
- Docker (local Postgres)

## Local API

```bash
cp apps/api/.env.example apps/api/.env
docker compose -f infra/docker/docker-compose.yml up -d
pnpm install
pnpm --filter @codecore/api db:migrate
pnpm --filter @codecore/api start:dev
```

Health: `GET http://localhost:4999/api/v1/health`

Local Docker publishes Postgres on host port **55432** so it does not collide with other local databases. Those credentials are disposable and are not valid outside local development.

## Local Flutter

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=APP_ENV=local
```

Android emulator uses `http://10.0.2.2:4999/api/v1` by default. iOS simulator uses `http://127.0.0.1:4999/api/v1`.

## Quality

```bash
pnpm --filter @codecore/api lint
pnpm --filter @codecore/api test
pnpm --filter @codecore/api build
cd apps/mobile && dart format --set-exit-if-changed . && flutter analyze && flutter test
```
