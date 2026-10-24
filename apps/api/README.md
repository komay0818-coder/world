# Lorn Continent API — Phase 1A

This is the isolated backend foundation. It does not read or migrate the game's
IndexedDB/localStorage data.

## Local start

1. Copy `.env.example` to `.env`.
2. Point `DATABASE_URL` at a disposable local or Dev PostgreSQL database.
3. Add the database hostname to `DATABASE_ALLOWED_HOSTS`.
4. Set `SUPABASE_URL` to a Dev Supabase project.
5. Run `pnpm install`, `pnpm db:migrate`, then `pnpm dev`.

The process refuses to start when the environment is not `local` or `dev`, the
database host is not allow-listed, or the database name contains `prod`,
`production`, or `live`.

## Endpoints

- `GET /health/live` — process liveness; no database query.
- `GET /health/ready` — returns 200 only when PostgreSQL responds.
- `GET /v1/account` — validates a Supabase access token and returns only the
  account whose `auth_user_id` equals the token subject.

## Verification

- `pnpm test` runs isolated unit/API tests with no external services.
- `pnpm typecheck` verifies TypeScript.
- `pnpm test:db` performs a real Dev database connectivity and privilege check.
  It intentionally fails unless a safe Dev database configuration is present.
