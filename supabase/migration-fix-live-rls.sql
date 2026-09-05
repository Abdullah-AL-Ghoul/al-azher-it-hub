-- ============================================================
-- LIVE RLS FIX — AL-Azher IT Hub (URGENT)
-- Closes an active PII leak: `activity` and `student_logs`
-- (which store studentId, name, ip, device, user-agent) were
-- readable by ANONYMOUS callers in the live database (RLS not
-- effective on these two tables). Verified 2026-08-29:
--   GET /rest/v1/activity      -> 200, 168 rows incl. PII
--   GET /rest/v1/student_logs  -> 200, 297 rows incl. PII
--
-- Run this FIRST in the Supabase SQL Editor (before
-- migration-security-hardening.sql). Idempotent; safe to re-run.
-- ============================================================

-- ============================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS is inert without this)
-- ============================================================
alter table public.activity enable row level security;
alter table public.student_logs enable row level security;

-- ============================================================
-- 2. DROP EVERY EXISTING POLICY on both tables — including any
--    leftover anon-open policy created from the Supabase
--    dashboard ("Enable read access to all users") or from
--    migration-notifications-rls.sql. This guarantees no
--    permissive policy survives.
-- ============================================================
drop policy if exists "activity_all_read" on public.activity;
drop policy if exists "activity_admin_read" on public.activity;
drop policy if exists "activity_auth_insert" on public.activity;
drop policy if exists "activity_public_insert" on public.activity;
drop policy if exists "Enable read access for all users" on public.activity;
drop policy if exists "Enable insert for authenticated users only" on public.activity;
drop policy if exists "Enable read access for all users" on public.student_logs;
drop policy if exists "logs_admin_read" on public.student_logs;
drop policy if exists "logs_auth_insert" on public.student_logs;
drop policy if exists "logs_public_insert" on public.student_logs;
drop policy if exists "Enable insert for authenticated users only" on public.student_logs;

-- ============================================================
-- 3. RE-CREATE STRICT POLICIES
--    Reads: admin-only (admins legitimately need the PII for
--    moderation/audit). Writes: authenticated-only inserts;
--    rows are scoped server-side via add_student_log RPC and the
--    client no longer supplies PII fields directly.
-- ============================================================
create policy "activity_admin_read" on public.activity
  for select using (public.is_current_user_admin());

create policy "activity_auth_insert" on public.activity
  for insert with check (auth.role() = 'authenticated');

create policy "logs_admin_read" on public.student_logs
  for select using (public.is_current_user_admin());

-- Students may read their OWN activity log (profile heatmap); admins see all.
create policy "logs_own_read" on public.student_logs
  for select using (
    auth.role() = 'authenticated'
    and "studentId" = public.get_current_student_id()
  );

create policy "logs_auth_insert" on public.student_logs
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- 4. VERIFICATION (read-only) — expect:
--    RLS on both tables = true, and NO policy rows for anon
-- ============================================================
-- select relname, relrowsecurity from pg_class
--   where relname in ('activity','student_logs');
-- select policyname, cmd, roles from pg_policies
--   where tablename in ('activity','student_logs');
-- set local role anon;
-- select * from public.activity limit 1;       -- must FAIL (permission denied)
-- select * from public.student_logs limit 1;   -- must FAIL (permission denied)
