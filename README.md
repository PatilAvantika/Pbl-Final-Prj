# ngo-platform
<<<<<<< HEAD
=======

## Database migrations

Do **not** run `npx prisma migrate deploy` from the repo root — there is no `schema.prisma` here.

From the **repository root**:

```bash
npm run prisma:migrate
```

Or from the backend app folder:

```bash
cd ngo-platform-main/backend
npx prisma migrate deploy
```

Requires `ngo-platform-main/backend/.env` with a valid `DATABASE_URL`.
>>>>>>> 1b6924ba223f2824b6a6822a50b2c73bb554fc67
