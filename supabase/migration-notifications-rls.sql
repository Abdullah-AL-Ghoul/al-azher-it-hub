-- ============================================================
-- AL-Azher IT Hub — Notifications RLS fix
-- Run this in the Supabase SQL Editor (once).
-- Allows all logged-in users (authenticated) to read the
-- activity feed so the notification bell works for students.
-- ============================================================

-- Let every logged-in user read the activity feed (notifications).
drop policy if exists "activity_all_read" on public.activity;
create policy "activity_all_read" on public.activity
  for select using (auth.role() = 'authenticated');

-- RLS policies are OR'ed together, so the admin-only policy stays valid.
-- (admin can still read everything via "activity_admin_read")

-- Index to keep the notification feed fast for all users.
create index if not exists activity_timestamp_desc_idx
  on public.activity (timestamp desc);

-- ============================================================
-- Safer alternative (optional): if you do NOT want to expose
-- ip/device/studentId/name to students, replace the policy above
-- with a secure view instead:
--
--   create or replace view public.notifications_feed as
--     select type, action, detail, timestamp
--     from public.activity;
--   grant select on public.notifications_feed to authenticated;
-- ============================================================
