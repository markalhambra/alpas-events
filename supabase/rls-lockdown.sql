-- ============================================================
-- Supabase security lockdown for alpas-events
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- This app uses Prisma (direct Postgres) for almost all data access.
-- The browser only needs Supabase Auth (+ optional public Storage).
-- PostgREST (anon / authenticated JWT) must NOT read app tables.
-- ============================================================

-- 1) Enable RLS on all application tables (idempotent)
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plus_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guest_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rsvp_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seating_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bulk_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waitlist ENABLE ROW LEVEL SECURITY;
-- Prisma implicit many-to-many join (Event <> AdminUser)
ALTER TABLE IF EXISTS public."_EventAdmins" ENABLE ROW LEVEL SECURITY;

-- Do NOT use FORCE ROW LEVEL SECURITY here: Prisma connects as the table owner
-- (postgres / pooler role) and must keep bypassing RLS. PostgREST uses anon /
-- authenticated, which are subject to RLS + the REVOKEs below.

-- 2) Revoke broad API grants from anon + authenticated (PostgREST roles)
-- Prisma connects as the DB owner/postgres role and is unaffected.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'events',
    'admin_users',
    'guests',
    'plus_ones',
    'invitations',
    'email_templates',
    'activity_logs',
    'guest_change_history',
    'attendance_overrides',
    'rsvp_overrides',
    'seating_tables',
    'seats',
    'event_feedback',
    'bulk_import_jobs',
    'email_logs',
    'waitlist',
    '_EventAdmins'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
      -- No policies for anon/authenticated ⇒ default deny when RLS is on
    END IF;
  END LOOP;
END $$;

-- 3) Optional: lock down sequence usage if any serial columns exist
-- REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 4) Storage note (run separately in Storage policies UI if needed):
-- Bucket "email-assets" may stay public-read for QR/email images.
-- Do NOT allow anon INSERT/UPDATE/DELETE; uploads go through
-- /api/upload with the service role key on the server.

-- 5) Auth dashboard checklist (manual):
-- Authentication → Providers → Email → disable "Confirm email" only if you manage invites yourself
-- Authentication → Providers → disable public sign-ups (invite/admin-only)
-- Project Settings → API → never expose service_role in the browser
-- Prefer disabling the Data API for unused schemas if your plan/UI offers it
