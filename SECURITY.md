# Security & Supabase Free keep-alive

## Architecture

- **Auth:** Supabase Auth (session cookies)
- **Data:** Prisma → Postgres (`DATABASE_URL` pooler). Prisma **bypasses** Supabase RLS.
- **Authorization boundary:** `requireAdmin()` in Next.js API routes (must verify `AdminUser`, not only a Supabase session)
- **Service role:** server-only for Storage + Auth admin APIs

## Required Supabase dashboard steps

1. Open **SQL Editor** and run [`supabase/rls-lockdown.sql`](supabase/rls-lockdown.sql).
   - Covers all Prisma app tables **and** the implicit join table `"_EventAdmins"`.
   - Enables RLS with **no** anon/authenticated policies (default deny) and revokes table grants.
2. **Authentication → Providers → Email:** turn **off** public sign-up (admins are created via app/script).
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are **server-only** (Vercel env, never `NEXT_PUBLIC_`).
4. Storage bucket `email-assets`: public **read** OK for QR/images; no anon write.
5. After schema changes that add tables/joins, re-run the lockdown SQL (or confirm RLS is on in **Database → Tables**).

## App protections added

- Admin APIs use `requireAdmin()` (registered admin row + optional roles).
- Guest/QR cache, analytics, invitations, templates, seating GETs require admin.
- Public token routes remain: RSVP, feedback, guest QR check-in, QR image (rate-limited).
- Cron keep-alive is protected by `CRON_SECRET`.

## Free plan pause (keep-alive)

Supabase **Free** still pauses after **~1 week of inactivity**. Keep-alive **reduces** idle risk; only **Pro+** guarantees no pause.

### Vercel Cron

Vercel Cron can call `GET /api/cron/keep-alive` if you add a once-per-day schedule in the project Cron Jobs settings or `vercel.json` (Hobby: max once/day, e.g. `0 12 * * *`). Cron entries that run more often **fail the deployment** on Hobby.

If deploy validation rejects crons for your plan/team, use GitHub Actions ([`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml)) or `npm run db:keep-alive` instead.

Set in Vercel project env:

```
CRON_SECRET=<long random string>
```

Vercel sends `Authorization: Bearer <CRON_SECRET>` to cron routes when configured.

### Manual / external script

```bash
# .env.local
CRON_SECRET=your-secret
NEXT_PUBLIC_APP_URL=https://your-production-url
# or KEEP_ALIVE_URL=https://your-production-url/api/cron/keep-alive

npm run db:keep-alive
```

Schedule every 1–3 days (Task Scheduler, cron, GitHub Actions).

### Production recommendation

Upgrade the Supabase org to **Pro** for no pause + backups if this is a live event system.
