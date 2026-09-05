-- ============================================================
-- HIDE PASSWORD COLUMN - definitive fix
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Remove any table-level grant that could shadow the column revoke
revoke select on public.users from anon, authenticated;

-- 2) Revoke column-level select on the sensitive columns
revoke select (password) on public.users from anon, authenticated;

-- 3) Re-grant table-level select (the app needs to read users,
--    but without the password column - column revoke takes precedence)
grant select ("studentId", name, role, email, major, google, linkedin, whatsapp,
              status, "lastVisit", "lastIP", "lastDevice", "createdAt", auth_user_id)
  on public.users to anon, authenticated;

-- 4) Reload PostgREST schema cache so the change takes effect
NOTIFY pgrst, 'reload schema';

-- 5) Verification query (should fail / return permission denied)
select "studentId", password from public.users limit 1;