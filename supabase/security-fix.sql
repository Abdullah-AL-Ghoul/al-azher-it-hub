-- ============================================================
-- SECURITY HARDENING FIX - AL-Azher IT Hub
-- Apply this in Supabase Dashboard > SQL Editor
--
-- IMPORTANT: security-consolidated.sql SUPERSEDES the policies
-- defined below (it enables RLS on every table, replaces the
-- `users_public_read ... using (true)` policy below with proper
-- self/admin policies, closes link_auth_user escalation, adds the
-- comments DELETE policy, and restricts storage uploads to admins).
-- Apply this file first, then security-consolidated.sql.
--
-- Fixes:
--   1. Removes leaked admin-key backdoor (old function signatures)
--   2. Hides password hashes from anon + authenticated
--   3. Removes `or true` policy that exposed all user data
--   4. Locks down users table (no direct UPDATE; RPC-only writes)
--   5. Server-side password verification (no hash leaks in client)
--   6. Content tables require LOGIN (anon is fully blocked)
--   7. favorites/ratings/user_stats = owner + admin only
--   8. logs/activity = admin read only
-- ============================================================

-- ============================================================
-- 1. DROP ALL OLD KEY-BASED FUNCTIONS (THE BACKDOOR)
--    These still accept the leaked admin key
-- ============================================================
drop function if exists public.is_admin_key(text);
drop function if exists public.admin_save_rows(text, jsonb, text);
drop function if exists public.admin_delete_row(text, text, text);
drop function if exists public.admin_save_setting(text, jsonb, text);
drop function if exists public.admin_clear_activity(text);
drop function if exists public.admin_manage_user(text, jsonb, text);
drop function if exists public.student_update_profile(text, jsonb);
drop function if exists public.student_touch_visit(text, text, text);
drop function if exists public.reset_password(text, text, text, text);

-- ============================================================
-- 2. REMOVE THE STORED ADMIN SECRET HASH
-- ============================================================
delete from public.settings where key = 'admin_secret_hash';

-- ============================================================
-- 3. HIDE SENSITIVE USER COLUMNS FROM ANON + AUTHENTICATED
--    password can never be selected via REST.
--    auth_user_id stays readable (it is just a UUID already
--    present in the JWT) so the login lookup by auth_user_id
--    continues to work.
-- ============================================================
revoke select (password)
  on public.users from anon, authenticated;

-- ============================================================
-- 4. FIX users RLS - remove the `or true` exposure
--    NO direct UPDATE allowed on users table at all.
--    All user modifications go through SECURITY DEFINER RPCs:
--      - link_auth_user()     -> link auth account
--      - student_update_profile() -> edit own profile
--      - student_touch_visit()    -> update lastVisit
--      - admin_manage_user()      -> admin edits
--      - reset_password()         -> password change
-- ============================================================
drop policy if exists "users_public_read" on public.users;
drop policy if exists "users_own_profile" on public.users;
drop policy if exists "users_self_read" on public.users;
drop policy if exists "users_admin_read" on public.users;
-- Self + admin only. (A `using (true)` here previously exposed every user's
-- PII to any caller; the consolidated migration keeps this posture.)
create policy "users_self_read" on public.users
  for select using (auth.uid() = auth_user_id);
create policy "users_admin_read" on public.users
  for select using (public.is_current_user_admin());

revoke update on public.users from anon, authenticated;

-- SECURITY DEFINER: link the current auth user to their profile row.
-- Verifies the JWT's studentId metadata matches (when present).
-- Only ever writes auth_user_id - cannot change role/other fields.
create or replace function public.link_auth_user(p_student_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_sid text;
begin
  if p_student_id is null or p_student_id = '' then
    raise exception 'STUDENT_ID_REQUIRED';
  end if;
  meta_sid := nullif(auth.jwt() ->> 'studentId', '');
  if meta_sid is not null and meta_sid <> p_student_id then
    raise exception 'FORBIDDEN';
  end if;
  update public.users
  set auth_user_id = auth.uid()
  where "studentId" = p_student_id;
end;
$$;

grant execute on function public.link_auth_user(text) to anon, authenticated;

-- ============================================================
-- 5. SERVER-SIDE PASSWORD VERIFICATION (no hash leaks)
--    The stored PBKDF2 hash NEVER leaves the DB.
--    Client: get_password_salt() -> compute PBKDF2 locally
--            (fast, browser crypto.subtle) -> verify_password()
--            compares candidate hash against stored hash.
-- ============================================================

-- Returns ONLY the salt for a student (salt is not secret).
-- Used by the legacy login fallback to re-derive PBKDF2 locally.
create or replace function public.get_password_salt(p_student_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  stored text;
begin
  select password into stored from public.users where "studentId" = p_student_id;
  if stored is null or stored = '' then
    return null;
  end if;
  if position(':' in stored) > 0 then
    return split_part(stored, ':', 1);
  end if;
  return ''; -- legacy unsalted hash
end;
$$;

-- Compares a client-supplied candidate hash against the stored hash.
-- Returns true only on exact match. Never returns the stored value.
create or replace function public.verify_password(p_student_id text, p_candidate_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored text;
begin
  if p_candidate_hash is null or p_candidate_hash = '' then
    return false;
  end if;
  select password into stored from public.users where "studentId" = p_student_id;
  if stored is null or stored = '' or stored = 'legacy:ignore' then
    return false;
  end if;
  if position(':' in stored) > 0 then
    return split_part(stored, ':', 2) = p_candidate_hash;
  end if;
  return stored = p_candidate_hash;
end;
$$;

grant execute on function public.get_password_salt(text) to anon, authenticated;
grant execute on function public.verify_password(text, text) to anon, authenticated;

-- ============================================================
-- 6. CONTENT REQUIRES LOGIN - unauthenticated users are BLOCKED
--     from reading all content. Only registered users (with a
--     Supabase Auth session) can access the site's content.
-- ============================================================
drop policy if exists "content_public_read" on public.courses;
drop policy if exists "content_auth_read" on public.courses;
create policy "content_auth_read" on public.courses
  for select using (auth.role() = 'authenticated');

drop policy if exists "content_public_read" on public.lectures;
drop policy if exists "content_auth_read" on public.lectures;
create policy "content_auth_read" on public.lectures
  for select using (auth.role() = 'authenticated');

drop policy if exists "content_public_read" on public.sources;
drop policy if exists "content_auth_read" on public.sources;
create policy "content_auth_read" on public.sources
  for select using (auth.role() = 'authenticated');

drop policy if exists "content_public_read" on public.additions;
drop policy if exists "content_auth_read" on public.additions;
create policy "content_auth_read" on public.additions
  for select using (auth.role() = 'authenticated');

drop policy if exists "content_public_read" on public.subjects;
drop policy if exists "content_auth_read" on public.subjects;
create policy "content_auth_read" on public.subjects
  for select using (auth.role() = 'authenticated');

drop policy if exists "content_public_read" on public.settings;
drop policy if exists "content_auth_read" on public.settings;
create policy "content_auth_read" on public.settings
  for select using (auth.role() = 'authenticated');

-- comments: read + insert require login; delete by owner/admin
drop policy if exists "comments_public_read" on public.comments;
drop policy if exists "comments_auth_read" on public.comments;
create policy "comments_auth_read" on public.comments
  for select using (auth.role() = 'authenticated');

drop policy if exists "comments_public_insert" on public.comments;
drop policy if exists "comments_auth_insert" on public.comments;
create policy "comments_auth_insert" on public.comments
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- 7. STUDENT SELF-SERVICE TABLES REQUIRE LOGIN
--     favorites / ratings / user_stats are owned by a student;
--     anon (unauthenticated) gets NOTHING.
-- ============================================================
drop policy if exists "favorites_public_all" on public.favorites;
drop policy if exists "favorites_self" on public.favorites;
create policy "favorites_self" on public.favorites
  for all using (
    auth.role() = 'authenticated'
    and (
      "studentId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      "studentId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  );

drop policy if exists "ratings_public_all" on public.ratings;
drop policy if exists "ratings_self" on public.ratings;
create policy "ratings_self" on public.ratings
  for all using (
    auth.role() = 'authenticated'
    and (
      "studentId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      "studentId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  );

drop policy if exists "user_stats_public_all" on public.user_stats;
drop policy if exists "user_stats_self" on public.user_stats;
create policy "user_stats_self" on public.user_stats
  for all using (
    auth.role() = 'authenticated'
    and (
      "studentId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      "studentId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  );

-- ============================================================
-- 8. LOGS + ACTIVITY: admin-only read, login-required insert
-- ============================================================
drop policy if exists "logs_admin_read" on public.student_logs;
create policy "logs_admin_read" on public.student_logs
  for select using (public.is_current_user_admin());
drop policy if exists "logs_public_insert" on public.student_logs;
drop policy if exists "logs_auth_insert" on public.student_logs;
create policy "logs_auth_insert" on public.student_logs
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "activity_admin_read" on public.activity;
create policy "activity_admin_read" on public.activity
  for select using (public.is_current_user_admin());
drop policy if exists "activity_public_insert" on public.activity;
drop policy if exists "activity_auth_insert" on public.activity;
create policy "activity_auth_insert" on public.activity
  for insert with check (auth.role() = 'authenticated');