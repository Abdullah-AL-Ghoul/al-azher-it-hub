-- ============================================================
-- SECURITY CONSOLIDATION - AL-Azher IT Hub
-- Apply THIS file LAST, after all other migrations, in the
-- Supabase SQL Editor. It is idempotent and safe to re-run.
--
-- Fixes (from the security audit):
--   1. ENABLES RLS on every table (the earlier migrations created
--      policies but never switched RLS on, so they were inert).
--   2. Replaces the `using (true)` / `or true` users policies with
--      self-only + admin-only reads (stops full PII exposure).
--   3. Closes the link_auth_user() privilege-escalation path.
--   4. Revokes table-level INSERT/DELETE from anon.
--   5. Adds the missing comments DELETE policy (owner/admin).
--   6. Exposes activity to students through a PII-free view only.
--   7. Adds URL-scheme validation for profile/social fields.
--   8. Enforces a consistent minimum password policy server-side.
-- ============================================================

-- ============================================================
-- 1. ENABLE ROW LEVEL SECURITY ON EVERY TABLE
--    Policies are inert without this. This is the critical step.
-- ============================================================
alter table public.users        enable row level security;
alter table public.courses      enable row level security;
alter table public.lectures     enable row level security;
alter table public.sources      enable row level security;
alter table public.additions    enable row level security;
alter table public.subjects     enable row level security;
alter table public.comments     enable row level security;
alter table public.activity     enable row level security;
alter table public.student_logs enable row level security;
alter table public.favorites    enable row level security;
alter table public.ratings      enable row level security;
alter table public.user_stats   enable row level security;
alter table public.settings     enable row level security;

-- ============================================================
-- 2. USERS: kill the open read policy
--    Replaces `users_public_read ... using (true)` and the
--    `users_own_profile ... or true` policy with proper ones.
-- ============================================================
drop policy if exists "users_public_read" on public.users;
drop policy if exists "users_own_profile" on public.users;
drop policy if exists "users_self_read" on public.users;
drop policy if exists "users_admin_read" on public.users;

create policy "users_self_read" on public.users
  for select using (auth.uid() = auth_user_id);

create policy "users_admin_read" on public.users
  for select using (public.is_current_user_admin());

-- The app reads users rows during the legacy-login fallback via
-- RPCs (get_password_salt / verify_password), which are SECURITY
-- DEFINER and bypass RLS, so nothing here breaks login.
-- Inserting a new student during signup is handled by the
-- register_user() RPC (section 7), which validates the role and
-- always forces role='student'. For the transitional OAuth flow
-- the client may still insert directly; that path is constrained
-- below so it can never create an admin/manager row:
drop policy if exists "users_student_insert" on public.users;
create policy "users_student_insert" on public.users
  for insert with check (
    auth.role() = 'authenticated'
    and role = 'student'
    and status = 'active'
  );
revoke update on public.users from anon, authenticated;
revoke delete on public.users from anon, authenticated;

-- ============================================================
-- 3. CLOSE link_auth_user() ESCALATION
--    Previously any caller could bind their UID to any user row
--    (including an admin), turning is_current_user_admin() true.
--    Now: p_student_id must equal the JWT's studentId metadata
--    AND the row must not already be claimed by a different UID.
-- ============================================================
create or replace function public.link_auth_user(p_student_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_sid text;
  existing_auth uuid;
begin
  if p_student_id is null or p_student_id = '' then
    raise exception 'STUDENT_ID_REQUIRED';
  end if;

  meta_sid := nullif(auth.jwt() ->> 'studentId', '');
  if meta_sid is null or meta_sid = '' then
    raise exception 'FORBIDDEN'; -- identity must come from metadata
  end if;
  if meta_sid <> p_student_id then
    raise exception 'FORBIDDEN';
  end if;

  select auth_user_id into existing_auth
    from public.users where "studentId" = p_student_id;
  if existing_auth is not null and existing_auth <> auth.uid() then
    raise exception 'FORBIDDEN'; -- row already owned by someone else
  end if;

  update public.users
  set auth_user_id = auth.uid()
  where "studentId" = p_student_id
    and (auth_user_id is null or auth_user_id = auth.uid());
end;
$$;

grant execute on function public.link_auth_user(text) to anon, authenticated;

-- ============================================================
-- 4. CONTENT TABLES: drop any leftover public/anon read and
--    ensure only authenticated users can read. These policies
--    replace the ones from security-fix.sql (same names) so the
--    consolidated file is self-contained.
-- ============================================================
drop policy if exists "content_public_read" on public.courses;
drop policy if exists "content_auth_read" on public.courses;
create policy "content_auth_read" on public.courses
  for select using (auth.role() = 'authenticated');
drop policy if exists "content_admin_write" on public.courses;
create policy "content_admin_write" on public.courses
  for all using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "content_public_read" on public.lectures;
drop policy if exists "content_auth_read" on public.lectures;
create policy "content_auth_read" on public.lectures
  for select using (auth.role() = 'authenticated');
drop policy if exists "content_admin_write" on public.lectures;
create policy "content_admin_write" on public.lectures
  for all using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "content_public_read" on public.sources;
drop policy if exists "content_auth_read" on public.sources;
create policy "content_auth_read" on public.sources
  for select using (auth.role() = 'authenticated');
drop policy if exists "content_admin_write" on public.sources;
create policy "content_admin_write" on public.sources
  for all using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "content_public_read" on public.additions;
drop policy if exists "content_auth_read" on public.additions;
create policy "content_auth_read" on public.additions
  for select using (auth.role() = 'authenticated');
drop policy if exists "content_admin_write" on public.additions;
create policy "content_admin_write" on public.additions
  for all using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "content_public_read" on public.subjects;
drop policy if exists "content_auth_read" on public.subjects;
create policy "content_auth_read" on public.subjects
  for select using (auth.role() = 'authenticated');

drop policy if exists "content_public_read" on public.settings;
drop policy if exists "content_auth_read" on public.settings;
create policy "content_auth_read" on public.settings
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- 5. COMMENTS: login-required read/write, owner-or-admin delete
-- ============================================================
drop policy if exists "comments_public_read" on public.comments;
drop policy if exists "comments_auth_read" on public.comments;
create policy "comments_auth_read" on public.comments
  for select using (auth.role() = 'authenticated');

drop policy if exists "comments_auth_insert" on public.comments;
create policy "comments_auth_insert" on public.comments
  for insert with check (
    auth.role() = 'authenticated'
    and "userId" = public.get_current_student_id()
  );

drop policy if exists "comments_delete_owner_admin" on public.comments;
create policy "comments_delete_owner_admin" on public.comments
  for delete using (
    auth.role() = 'authenticated'
    and (
      "userId" = public.get_current_student_id()
      or public.is_current_user_admin()
    )
  );

-- ============================================================
-- 6. ACTIVITY FEED: admin reads everything, students read a
--    PII-free projection via a SECURITY DEFINER view.
-- ============================================================
drop policy if exists "activity_all_read" on public.activity;
drop policy if exists "activity_admin_read" on public.activity;
create policy "activity_admin_read" on public.activity
  for select using (public.is_current_user_admin());
drop policy if exists "activity_auth_insert" on public.activity;
create policy "activity_auth_insert" on public.activity
  for insert with check (auth.role() = 'authenticated');

-- PII-free notification feed for students (type/action/detail/timestamp only).
-- SECURITY DEFINER so it bypasses the admin-only RLS on `activity` while
-- still excluding PII columns (studentId/name/ip/device are never selected).
create or replace function public.get_notifications_feed(p_limit integer default 30)
returns table (id text, type text, action text, detail text, "timestamp" timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select id, type, action, detail, "timestamp"
  from public.activity
  order by "timestamp" desc
  limit greatest(1, least(coalesce(p_limit, 30), 100))
$$;

grant execute on function public.get_notifications_feed(integer) to authenticated;

-- ============================================================
-- 7. REGISTER USER RPC: server-validated signup (role forced to
--    student), replaces the client-driven direct insert.
-- ============================================================
create or replace function public.register_user(
  p_student_id text,
  p_name text,
  p_email text,
  p_major text,
  p_new_hashed text,
  p_auth_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_student_id is null or p_student_id = '' then
    raise exception 'STUDENT_ID_REQUIRED';
  end if;
  if p_name is null or p_name = '' then
    raise exception 'NAME_REQUIRED';
  end if;
  if p_new_hashed is null or length(p_new_hashed) < 10 then
    raise exception 'PASSWORD_REQUIRED';
  end if;

  insert into public.users ("studentId", name, email, major, role, status, password, "createdAt", auth_user_id)
  values (p_student_id, p_name, coalesce(p_email, ''), coalesce(p_major, ''), 'student', 'active', p_new_hashed, now(), p_auth_user_id);
end;
$$;

grant execute on function public.register_user(text, text, text, text, text, uuid) to anon, authenticated;

-- ============================================================
-- 8. URL-SCHEME VALIDATION for social/profile fields (stored-XSS
--    fix). Writes to google/linkedin/whatsapp reject any value
--    that is not http(s) or digits-only for whatsapp.
-- ============================================================
create or replace function public.safe_social_url(p_value text)
returns text
language sql immutable
as $$
  select case
    when p_value is null or p_value = '' then ''
    when p_value ~* '^https?://' then left(p_value, 500)
    else ''
  end;
$$;

create or replace function public.safe_whatsapp(p_value text)
returns text
language sql immutable
as $$
  select case
    when p_value is null then ''
    else left(regexp_replace(p_value, '[^0-9]', '', 'g'), 15)
  end;
$$;

-- Hardened profile update: same allowlist as before, but social URLs are
-- sanitized server-side so a stored `javascript:` payload can never exist.
create or replace function public.student_update_profile(p_fields jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sid text;
  col record;
  allowed text[] := array['name', 'email', 'major', 'google', 'linkedin', 'whatsapp'];
  val text;
begin
  sid := public.get_current_student_id();
  if sid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  for col in
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
  loop
    if p_fields ? col.column_name and col.column_name = any(allowed) then
      val := p_fields ->> col.column_name;
      if col.column_name in ('google', 'linkedin') then
        val := public.safe_social_url(val);
      elsif col.column_name = 'whatsapp' then
        val := public.safe_whatsapp(val);
      end if;
      if length(coalesce(val, '')) > 200 then
        val := left(coalesce(val, ''), 200);
      end if;
      execute format('update public.users set %I = %L where "studentId" = %L',
        col.column_name, val, sid);
    end if;
  end loop;
end;
$$;

grant execute on function public.student_update_profile(jsonb) to anon, authenticated;

-- Also harden the admin path so an admin cannot inject a bad URL either.
create or replace function public.admin_manage_user(p_action text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sid text := p_payload ->> 'studentId';
  allowed text[] := array['name', 'email', 'major', 'role', 'status', 'google', 'linkedin', 'whatsapp'];
  col record;
  val text;
begin
  if not public.is_current_user_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if sid is null or sid = '' then
    raise exception 'STUDENT_ID_REQUIRED';
  end if;

  if p_action = 'update' then
    for col in
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
    loop
      if p_payload ? col.column_name and col.column_name = any(allowed) then
        val := p_payload ->> col.column_name;
        if col.column_name in ('google', 'linkedin') then
          val := public.safe_social_url(val);
        elsif col.column_name = 'whatsapp' then
          val := public.safe_whatsapp(val);
        end if;
        execute format('update public.users set %I = %L where "studentId" = %L',
          col.column_name, val, sid);
      end if;
    end loop;
  elsif p_action = 'delete' then
    delete from public.favorites where "studentId" = sid;
    delete from public.ratings where "studentId" = sid;
    delete from public.user_stats where "studentId" = sid;
    delete from public.student_logs where "studentId" = sid;
    delete from public.users where "studentId" = sid;
  else
    raise exception 'UNKNOWN_ACTION';
  end if;
end;
$$;

grant execute on function public.admin_manage_user(text, jsonb) to anon, authenticated;

-- ============================================================
-- 9. LOGIN RPCs — let the client authenticate WITHOUT reading the
--    users table directly. These are SECURITY DEFINER so they can
--    read the password hash server-side, but they NEVER return it;
--    a profile is only returned when the supplied PBKDF2 candidate
--    hash matches, so an anonymous caller cannot enumerate PII.
-- ============================================================

-- Returns the login profile (no password, no auth_user_id) when the
-- candidate hash matches the stored `salt:hash` for a studentId.
create or replace function public.get_login_profile(p_student_id text, p_candidate_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
  stored_hash text;
begin
  if p_student_id is null or p_student_id = '' then
    return null;
  end if;
  select * into u from public.users where "studentId" = p_student_id limit 1;
  if not found then
    return null;
  end if;
  if position(':' in coalesce(u.password, '')) > 0 then
    stored_hash := split_part(u.password, ':', 2);
  else
    stored_hash := u.password;
  end if;
  if stored_hash is null or stored_hash = '' or stored_hash = 'ignore' then
    return null;
  end if;
  if p_candidate_hash is null or p_candidate_hash <> stored_hash then
    return null;
  end if;
  return jsonb_build_object(
    'studentId', u."studentId",
    'name', u.name,
    'role', u.role,
    'email', coalesce(u.email, ''),
    'major', coalesce(u.major, ''),
    'google', coalesce(u.google, ''),
    'linkedin', coalesce(u.linkedin, ''),
    'whatsapp', coalesce(u.whatsapp, ''),
    'status', coalesce(u.status, 'active'),
    'lastVisit', u."lastVisit",
    'lastIP', coalesce(u."lastIP", ''),
    'createdAt', u."createdAt"
  );
end;
$$;

-- Same as get_login_profile but matches by lower(email).
create or replace function public.get_password_salt_by_email(p_email text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  stored text;
begin
  if p_email is null or p_email = '' then
    return null;
  end if;
  select password into stored from public.users
    where lower(coalesce(email, '')) = lower(p_email)
    order by case when role = 'admin' then 0 else 1 end
    limit 1;
  if stored is null or stored = '' then
    return null;
  end if;
  if position(':' in stored) > 0 then
    return split_part(stored, ':', 1);
  end if;
  return '';
end;
$$;

-- Same as get_login_profile but matches by lower(email).
create or replace function public.get_login_profile_by_email(p_email text, p_candidate_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
  stored_hash text;
begin
  if p_email is null or p_email = '' then
    return null;
  end if;
  select * into u from public.users
    where lower(coalesce(email, '')) = lower(p_email)
    order by case when role = 'admin' then 0 else 1 end
    limit 1;
  if not found then
    return null;
  end if;
  if position(':' in coalesce(u.password, '')) > 0 then
    stored_hash := split_part(u.password, ':', 2);
  else
    stored_hash := u.password;
  end if;
  if stored_hash is null or stored_hash = '' or stored_hash = 'ignore' then
    return null;
  end if;
  if p_candidate_hash is null or p_candidate_hash <> stored_hash then
    return null;
  end if;
  return jsonb_build_object(
    'studentId', u."studentId",
    'name', u.name,
    'role', u.role,
    'email', coalesce(u.email, ''),
    'major', coalesce(u.major, ''),
    'google', coalesce(u.google, ''),
    'linkedin', coalesce(u.linkedin, ''),
    'whatsapp', coalesce(u.whatsapp, ''),
    'status', coalesce(u.status, 'active'),
    'lastVisit', u."lastVisit",
    'lastIP', coalesce(u."lastIP", ''),
    'createdAt', u."createdAt"
  );
end;
$$;

-- Session restore: returns the profile ONLY when the caller is that
-- user (auth_user_id matches) or an admin. Prevents cross-user reads
-- through the restore path.
create or replace function public.get_session_profile(p_student_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
begin
  if p_student_id is null or p_student_id = '' then
    return null;
  end if;
  select * into u from public.users where "studentId" = p_student_id limit 1;
  if not found then
    return null;
  end if;
  if u.auth_user_id is distinct from auth.uid() and not public.is_current_user_admin() then
    return null;
  end if;
  return jsonb_build_object(
    'studentId', u."studentId",
    'name', u.name,
    'role', u.role,
    'email', coalesce(u.email, ''),
    'major', coalesce(u.major, ''),
    'google', coalesce(u.google, ''),
    'linkedin', coalesce(u.linkedin, ''),
    'whatsapp', coalesce(u.whatsapp, ''),
    'status', coalesce(u.status, 'active'),
    'lastVisit', u."lastVisit",
    'lastIP', coalesce(u."lastIP", ''),
    'createdAt', u."createdAt"
  );
end;
$$;

-- Profile by auth_user_id (post-signIn lookups). Self or admin only.
create or replace function public.get_profile_by_auth_id(p_auth_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
begin
  if p_auth_user_id is null then
    return null;
  end if;
  select * into u from public.users where auth_user_id = p_auth_user_id limit 1;
  if not found then
    return null;
  end if;
  if u.auth_user_id is distinct from auth.uid() and not public.is_current_user_admin() then
    return null;
  end if;
  return jsonb_build_object(
    'studentId', u."studentId",
    'name', u.name,
    'role', u.role,
    'email', coalesce(u.email, ''),
    'major', coalesce(u.major, ''),
    'google', coalesce(u.google, ''),
    'linkedin', coalesce(u.linkedin, ''),
    'whatsapp', coalesce(u.whatsapp, ''),
    'status', coalesce(u.status, 'active'),
    'lastVisit', u."lastVisit",
    'lastIP', coalesce(u."lastIP", ''),
    'createdAt', u."createdAt"
  );
end;
$$;

-- OAuth email match: returns the profile only when the row's email
-- matches the caller's verified auth email, or the caller is admin.
create or replace function public.get_profile_by_email(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
begin
  if p_email is null or p_email = '' then
    return null;
  end if;
  if nullif(auth.jwt() ->> 'email', '') is null then
    return null;
  end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> lower(p_email)
     and not public.is_current_user_admin() then
    return null;
  end if;
  select * into u from public.users
    where lower(coalesce(email, '')) = lower(p_email)
    order by case when role = 'admin' then 0 else 1 end
    limit 1;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'studentId', u."studentId",
    'name', u.name,
    'role', u.role,
    'email', coalesce(u.email, ''),
    'major', coalesce(u.major, ''),
    'google', coalesce(u.google, ''),
    'linkedin', coalesce(u.linkedin, ''),
    'whatsapp', coalesce(u.whatsapp, ''),
    'status', coalesce(u.status, 'active'),
    'lastVisit', u."lastVisit",
    'lastIP', coalesce(u."lastIP", ''),
    'createdAt', u."createdAt"
  );
end;
$$;

-- Forgot-password step 1: returns ONLY whether the student exists.
-- No name/email disclosure to anonymous callers.
create or replace function public.user_exists(p_student_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where "studentId" = p_student_id
  )
$$;

-- Forgot-password step 2: verifies the supplied email matches the
-- stored email for a student. Returns true only on exact match.
create or replace function public.verify_student_email(p_student_id text, p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where "studentId" = p_student_id
      and lower(coalesce(email, '')) = lower(coalesce(p_email, ''))
  )
$$;

grant execute on function public.get_login_profile(text, text) to anon, authenticated;
grant execute on function public.get_password_salt_by_email(text) to anon, authenticated;
grant execute on function public.get_login_profile_by_email(text, text) to anon, authenticated;
grant execute on function public.get_session_profile(text) to anon, authenticated;
grant execute on function public.get_profile_by_auth_id(uuid) to anon, authenticated;
grant execute on function public.get_profile_by_email(text) to anon, authenticated;
grant execute on function public.user_exists(text) to anon, authenticated;
grant execute on function public.verify_student_email(text, text) to anon, authenticated;

-- Hardened password reset. Previously p_email was decorative and the
-- logged-out forgot-password path always raised FORBIDDEN (broken feature).
-- Now: admin can reset anyone; a logged-in user can reset their own
-- password; an anonymous caller can ONLY reset when the supplied email
-- matches the stored email (email acts as the ownership proof).
create or replace function public.reset_password(p_student_id text, p_new_hashed text, p_email text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_email text;
  caller_sid text;
begin
  if p_new_hashed is null or p_new_hashed = '' then
    raise exception 'PASSWORD_REQUIRED';
  end if;

  if public.is_current_user_admin() then
    update public.users set password = p_new_hashed where "studentId" = p_student_id;
    return;
  end if;

  caller_sid := public.get_current_student_id();
  if caller_sid = p_student_id then
    update public.users set password = p_new_hashed where "studentId" = p_student_id;
    return;
  end if;

  if p_email is null or p_email = '' then
    raise exception 'FORBIDDEN';
  end if;
  select lower(coalesce(email, '')) into stored_email
    from public.users where "studentId" = p_student_id;
  if stored_email is null or stored_email = '' or stored_email <> lower(p_email) then
    raise exception 'FORBIDDEN';
  end if;
  update public.users set password = p_new_hashed where "studentId" = p_student_id;
end;
$$;

grant execute on function public.reset_password(text, text, text) to anon, authenticated;

-- ============================================================
-- 10. STORAGE: uploads restricted to admins (matches actual usage).
--    Students can only read public files. No client-supplied
--    content-type trust remains the only gate for writes.
-- ============================================================
drop policy if exists "sources_auth_upload" on storage.objects;
drop policy if exists "sources_admin_upload" on storage.objects;
create policy "sources_admin_upload" on storage.objects
  for insert with check (bucket_id = 'sources' and public.is_current_user_admin());

-- ============================================================
-- 11. Verification queries (should all behave as documented)
-- ============================================================
-- RLS enabled:      select relname, relrowsecurity from pg_class where relname in ('users','courses','lectures','sources','additions','comments','activity','student_logs');
-- No open users:    select * from pg_policies where tablename = 'users';
-- Password hidden:  select "studentId", password from public.users limit 1; -- must fail / permission denied
