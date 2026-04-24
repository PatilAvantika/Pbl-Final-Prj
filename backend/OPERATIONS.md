# Backend Operations Baseline

## Schema and migrations

- Always update `prisma/schema.prisma` through reviewed pull requests.
- Run `npx prisma generate` after schema changes.
- Apply schema updates in controlled environments with `npx prisma db push` (or migration flow once enabled).
- CI validates schema with `npx prisma validate`.

## Security baseline

- Keep `JWT_SECRET` and `JWT_EXPIRES_IN` set via environment variables.
- Do not enable demo login bypass behavior in production.
- Restrict privileged role assignment to admin-only workflows.

## Runtime health

- `GET /health` returns liveness.
- `GET /ready` confirms database readiness.
- Every request emits a structured JSON access log with `x-request-id`.

## Testing and verification

- Backend merge gate: build must pass.
- Frontend merge gate: build must pass.
- Add endpoint-level role matrix tests for critical admin routes (`/users`, `/tasks`, `/reports`, `/hr`).
