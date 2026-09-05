-- ============================================================
-- SECURITY HARDENING — AL-Azher IT Hub
-- Apply AFTER security-consolidated.sql (or instead of it if the
-- live DB already has consolidated applied). Idempotent; safe to
-- re-run. Review + verification checklist:
--   docs/SECURITY_MIGRATION_CHECKLIST.md
--
-- Fixes (from the 2026-08-27 professional audit, docs/AUDIT_REPORT.md):
--   C1  IDOR: toggle_favorite / set_rating / mark_viewed trusted a
--       client-supplied p_student_id with no ownership check and were
--       granted to anon. Owner is now resolved server-side from the
--       session; anon revoked.
--   H6  link_auth_user: pins the hardened version (JWT studentId
--       metadata required) so an authenticated user can never claim
--       another user's row (incl. an admin row).
--   H2/H3/H5  Server-side throttling: generic throttle_request()
--       applied to every anon-reachable sensitive RPC (login profile,
--       salt-by-email, existence, signup, reset chain). Previously all
--       limits were client-side and bypassable.
--   H1  Reset chain: verify_student_email / reset_password re-pinned
--       to strict real-email-only versions (the synthetic
--       studentId@al-azher.local ownership proof is removed) + throttled.
--   H4  PII: PII-free get_notifications_feed re-pinned; activity read
--       policy is admin-only again (drop any leftover all-read policy).
--   M2  Comments: new get_comments_public() returns author display name
--       only (no raw userId) + isMine flag; insert policy now also
--       requires the display name to match the session user's name
--       (kills name spoofing).
--   M3  Storage: uploads must pass an extension + content-type
--       allowlist (no html/svg/js/xml) server-side, not just client-side.
--   M6  reset_password / register_user enforce a minimum hash length.
--   M9  student_logs: new add_student_log() derives studentId/name
--       from the session server-side; direct inserts of forged rows
--       no longer possible.
--   L7  admin_save_rows: url columns (additions/sources/lectures) are
--       scheme-validated server-side (http/https only).
-- ============================================================

-- ============================================================
-- 1. GENERIC SERVER-SIDE THROTTLE
--    Generalizes the password_attempts pattern (patch-password-
--    oracle-throttle.sql) to any (action, key) pair. RLS on, no
--    policies, revoked from anon/authenticated — reachable only
--    through the SECURITY DEFINER functions below.
-- ============================================================
create table if not exists public.request_throttle (
  action       text not null,
  key          text not null,
  attempts     int  not null default 0,
  window_start timestamptz not null default now(),
  primary key (action, key)
);

alter table public.request_throttle enable row level security;
revoke all on public.request_throttle from anon, authenticated;

-- Best-effort client IP from the PostgREST request headers GUC.
create or replace function public.client_ip()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  v_headers jsonb;
  v_ip text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return 'unknown';
  end;
  v_ip := v_headers ->> 'x-forwarded-for';
  if v_ip is null or v_ip = '' then
    v_ip := v_headers ->> 'cf-connecting-ip';
  end if;
  if v_ip is null or v_ip = '' then
    return 'unknown';
  end if;
  -- x-forwarded-for can be a comma-separated chain; take the leftmost.
  return lower(trim(split_part(v_ip, ',', 1)));
end;
$$;

-- Fixed-window limiter: raises TOO_MANY_ATTEMPTS once the budget is
-- spent, otherwise increments and returns the new attempt count.
create or replace function public.throttle_request(
  p_action text,
  p_key text,
  p_max_attempts int default 10,
  p_window_minutes int default 15
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts int;
  v_window_start timestamptz;
begin
  if p_action is null or p_action = '' then
    p_action := 'generic';
  end if;
  p_key := coalesce(p_key, '');
  if p_key = '' then
    p_key := 'ip:' || public.client_ip();
  end if;

  insert into request_throttle (action, key, attempts, window_start)
  values (p_action, p_key, 0, now())
  on conflict (action, key) do nothing;

  select attempts, window_start
    into v_attempts, v_window_start
    from request_throttle
   where action = p_action and key = p_key
   for update;

  if v_window_start is null then
    v_attempts := 0;
    v_window_start := now();
  end if;

  if v_window_start < now() - make_interval(mins => p_window_minutes) then
    update request_throttle
       set attempts = 0, window_start = now()
     where action = p_action and key = p_key;
    v_attempts := 0;
  end if;

  if coalesce(v_attempts, 0) >= p_max_attempts then
    raise exception 'TOO_MANY_ATTEMPTS' using errcode = 'P0001';
  end if;

  update request_throttle
     set attempts = attempts + 1
   where action = p_action and key = p_key;

  return coalesce(v_attempts, 0) + 1;
end;
$$;

create or replace function public.clear_request_throttle(p_action text, p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from request_throttle where action = p_action and key = p_key;
$$;

-- Throttle helpers are internal plumbing for the SECURITY DEFINER RPCs below;
-- they must never be executable by clients directly (anon could otherwise
-- clear its own counters). Revoked from everyone; the RPCs call them as the
-- function owner (postgres), so nothing breaks.
revoke all on function public.throttle_request(text, text, int, int) from public;
revoke all on function public.throttle_request(text, text, int, int) from anon, authenticated;
revoke all on function public.clear_request_throttle(text, text) from public;
revoke all on function public.clear_request_throttle(text, text) from anon, authenticated;

-- ============================================================
-- 2. C1 — CLOSE THE IDOR IN ATOMIC USER-DATA RPCs
--    Owner is derived from the session; the caller-supplied
--    p_student_id is ignored entirely. anon no longer has execute.
-- ============================================================
create or replace function public.toggle_favorite(p_student_id text, p_lecture_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids jsonb;
  sid text;
begin
  sid := public.get_current_student_id();
  if sid is null or sid = '' then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select coalesce(ids, '[]'::jsonb) into v_ids
    from public.favorites where "studentId" = sid for update;
  if v_ids is null then v_ids := '[]'::jsonb; end if;

  if v_ids ? p_lecture_id then
    v_ids := (select coalesce(jsonb_agg(e), '[]'::jsonb)
              from jsonb_array_elements_text(v_ids) e
              where e <> p_lecture_id);
  else
    v_ids := v_ids || to_jsonb(p_lecture_id);
  end if;

  insert into public.favorites ("studentId", ids)
  values (sid, v_ids)
  on conflict ("studentId") do update set ids = excluded.ids;

  return v_ids;
end;
$$;

create or replace function public.set_rating(p_student_id text, p_lecture_id text, p_rating int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ratings jsonb;
  sid text;
begin
  sid := public.get_current_student_id();
  if sid is null or sid = '' then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING';
  end if;

  select coalesce(ratings, '{}'::jsonb) into v_ratings
    from public.ratings where "studentId" = sid for update;
  if v_ratings is null then v_ratings := '{}'::jsonb; end if;

  v_ratings := v_ratings || jsonb_build_object(p_lecture_id, p_rating);

  insert into public.ratings ("studentId", ratings)
  values (sid, v_ratings)
  on conflict ("studentId") do update set ratings = excluded.ratings;

  return v_ratings;
end;
$$;

create or replace function public.mark_viewed(p_student_id text, p_lecture_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewed jsonb;
  sid text;
begin
  sid := public.get_current_student_id();
  if sid is null or sid = '' then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select coalesce(viewed, '[]'::jsonb) into v_viewed
    from public.user_stats where "studentId" = sid for update;
  if v_viewed is null then v_viewed := '[]'::jsonb; end if;

  if not (v_viewed ? p_lecture_id) then
    v_viewed := v_viewed || to_jsonb(p_lecture_id);
  end if;

  insert into public.user_stats ("studentId", viewed, "lastVisit")
  values (sid, v_viewed, now())
  on conflict ("studentId") do update set viewed = excluded.viewed, "lastVisit" = excluded."lastVisit";

  return v_viewed;
end;
$$;

-- Only authenticated students need these; anon is revoked.
revoke all on function public.toggle_favorite(text, text) from anon;
revoke all on function public.set_rating(text, text, int) from anon;
revoke all on function public.mark_viewed(text, text) from anon;
grant execute on function public.toggle_favorite(text, text) to authenticated;
grant execute on function public.set_rating(text, text, int) to authenticated;
grant execute on function public.mark_viewed(text, text) to authenticated;

-- ============================================================
-- 3. H6 — PIN THE HARDENED link_auth_user
--    p_student_id must equal the JWT's studentId metadata AND the
--    row must not be claimed by a different UID. An unauthenticated
--    or metadata-less caller cannot bind any row.
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
-- 4. H2/H3/H5 — THROTTLE EVERY ANON-REACHABLE SENSITIVE RPC
--    All of these previously ran unthrottled; the only limits were
--    client-side (bypassable). Budgets: 10 per 15-minute window per
--    key. Key = account (studentId/email) + client IP.
-- ============================================================

-- Login by studentId (the production login path). Was `stable`;
-- now writes throttle counters, so it must be volatile.
create or replace function public.get_login_profile(p_student_id text, p_candidate_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
  stored_hash text;
  v_key text;
begin
  if p_student_id is null or p_student_id = '' then
    return null;
  end if;
  v_key := lower(trim(p_student_id)) || '|' || public.client_ip();
  perform public.throttle_request('login_profile', v_key);

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

  perform public.clear_request_throttle('login_profile', v_key);

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

-- Salt-by-email: existence/shape oracle -> throttled.
create or replace function public.get_password_salt_by_email(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  stored text;
begin
  if p_email is null or p_email = '' then
    return null;
  end if;
  perform public.throttle_request('salt_by_email', lower(trim(p_email)) || '|' || public.client_ip());

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

-- Login by email: throttled.
create or replace function public.get_login_profile_by_email(p_email text, p_candidate_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
  stored_hash text;
  v_key text;
begin
  if p_email is null or p_email = '' then
    return null;
  end if;
  v_key := lower(trim(p_email)) || '|' || public.client_ip();
  perform public.throttle_request('login_profile_email', v_key);

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

  perform public.clear_request_throttle('login_profile_email', v_key);

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

-- Existence oracle -> throttled (per-ID + per-IP).
create or replace function public.user_exists(p_student_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_student_id is null or p_student_id = '' then
    return false;
  end if;
  perform public.throttle_request('user_exists', lower(trim(p_student_id)) || '|' || public.client_ip());
  return exists (
    select 1 from public.users where "studentId" = p_student_id
  );
end;
$$;

-- Signup -> throttled (per-ID + per-IP). Also enforces a minimum
-- hash length consistent with reset_password.
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

  perform public.throttle_request('register', lower(trim(p_student_id)) || '|' || public.client_ip(), 5, 60);

  insert into public.users ("studentId", name, email, major, role, status, password, "createdAt", auth_user_id)
  values (p_student_id, p_name, coalesce(p_email, ''), coalesce(p_major, ''), 'student', 'active', p_new_hashed, now(), p_auth_user_id);
end;
$$;

grant execute on function public.register_user(text, text, text, text, text, uuid) to anon, authenticated;

-- ============================================================
-- 5. H1 — RESET CHAIN: strict email-only proof + throttling
--    The synthetic `studentId@al-azher.local` ownership proof is
--    removed: verify_student_email and reset_password now accept
--    only the student's real stored email. Both are throttled.
--    NOTE: accounts with an empty stored email cannot use the
--    anonymous reset path anymore — handle them via admin reset or
--    the Supabase Auth email flow (see checklist).
-- ============================================================
create or replace function public.verify_student_email(p_student_id text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_student_id is null or p_student_id = '' then
    return false;
  end if;
  perform public.throttle_request('verify_email', lower(trim(p_student_id)) || '|' || public.client_ip());
  return exists (
    select 1 from public.users
    where "studentId" = p_student_id
      and lower(coalesce(email, '')) = lower(coalesce(p_email, ''))
  );
end;
$$;

create or replace function public.verify_student_name(p_student_id text, p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_student_id is null or p_student_id = '' then
    return false;
  end if;
  perform public.throttle_request('verify_name', lower(trim(p_student_id)) || '|' || public.client_ip());
  return exists (
    select 1 from public.users
    where "studentId" = p_student_id
      and lower(replace(coalesce(name, ''), ' ', ''))
          = lower(replace(coalesce(p_name, ''), ' ', ''))
  );
end;
$$;

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
  if p_new_hashed is null or length(p_new_hashed) < 10 then
    raise exception 'PASSWORD_REQUIRED';
  end if;
  if p_student_id is null or p_student_id = '' then
    raise exception 'STUDENT_ID_REQUIRED';
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

  -- Anonymous reset: only with the real stored email as proof, throttled.
  perform public.throttle_request('reset_password', lower(trim(p_student_id)) || '|' || public.client_ip());

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

grant execute on function public.verify_student_email(text, text) to anon, authenticated;
grant execute on function public.verify_student_name(text, text) to anon, authenticated;
grant execute on function public.reset_password(text, text, text) to anon, authenticated;
grant execute on function public.user_exists(text) to anon, authenticated;
grant execute on function public.get_login_profile(text, text) to anon, authenticated;
grant execute on function public.get_login_profile_by_email(text, text) to anon, authenticated;
grant execute on function public.get_password_salt_by_email(text) to anon, authenticated;

-- ============================================================
-- 6. H4 — ACTIVITY FEED: admin-only direct reads, PII-free feed
--    Drops any leftover all-read policy (e.g. from
--    migration-notifications-rls.sql) and re-pins the PII-free
--    feed function.
-- ============================================================
drop policy if exists "activity_all_read" on public.activity;
drop policy if exists "activity_admin_read" on public.activity;
create policy "activity_admin_read" on public.activity
  for select using (public.is_current_user_admin());

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
-- 7. M2 — COMMENTS: name-only read path + spoof-proof insert
--    get_comments_public() exposes the author display name and an
--    isMine flag (computed server-side) but never the raw userId.
--    The insert policy additionally requires the submitted
--    userName to equal the session user's stored name.
-- ============================================================
create or replace function public.get_comments_public(p_addition_id text)
returns table (id text, "additionId" text, "userName" text, text text, "createdAt" timestamptz, "isMine" boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c."additionId",
    c."userName",
    c.text,
    c."createdAt",
    (c."userId" = public.get_current_student_id()) as "isMine"
  from public.comments c
  where c."additionId" = p_addition_id
  order by c."createdAt" desc
  limit 100
$$;

grant execute on function public.get_comments_public(text) to authenticated;

drop policy if exists "comments_auth_insert" on public.comments;
create policy "comments_auth_insert" on public.comments
  for insert with check (
    auth.role() = 'authenticated'
    and "userId" = public.get_current_student_id()
    and "userName" = (select name from public.users where "studentId" = public.get_current_student_id())
  );

-- ============================================================
-- 8. M3 — STORAGE: server-side extension + content-type allowlist
--    Uploads to the `sources` bucket must be admin-initiated AND
--    match an allowlisted extension with a non-executable
--    content-type. Blocks html/svg/js/xml payloads served from
--    the public bucket.
-- ============================================================
create or replace function public.is_safe_source_object(p_name text, p_content_type text)
returns boolean
language sql
immutable
as $$
  select
    coalesce(lower(p_content_type), '') not in (
      'text/html', 'image/svg+xml', 'application/javascript',
      'text/javascript', 'application/xhtml+xml', 'application/xml',
      'text/xml', 'text/html; charset=utf-8'
    )
    and lower(coalesce(p_name, '')) ~ '\.(pdf|docx?|pptx?|xlsx?|csv|txt|zip|rar|7z|png|jpe?g|gif|webp|avif|bmp|mp4|webm|mp3|json)$'
$$;

drop policy if exists "sources_auth_upload" on storage.objects;
drop policy if exists "sources_admin_upload" on storage.objects;
-- storage.objects has no bare content_type column — the mimetype lives in
-- metadata->>'mimetype' on modern Supabase storage schemas.
create policy "sources_admin_upload" on storage.objects
  for insert with check (
    bucket_id = 'sources'
    and public.is_current_user_admin()
    and public.is_safe_source_object(name, coalesce(metadata->>'mimetype', ''))
  );

-- ============================================================
-- 9. L7 — admin_save_rows: scheme-validate url columns
--    Re-pins admin_save_rows so a url stored in additions/sources/
--    lectures can only ever be http(s). (safe_social_url returns ''
--    for any other scheme, e.g. javascript:.)
-- ============================================================
create or replace function public.admin_save_rows(p_table text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  col record;
  col_list text[] := '{}';
  val_list text[] := '{}';
  upd_list text[] := '{}';
  new_id text;
  q text;
  val text;
  result jsonb := '[]'::jsonb;
begin
  if not public.is_current_user_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_table not in ('courses', 'lectures', 'sources', 'additions') then
    raise exception 'UNKNOWN_TABLE';
  end if;

  for item in select * from jsonb_array_elements(p_rows)
  loop
    new_id := coalesce(item ->> 'id', gen_random_uuid()::text);
    col_list := '{}';
    val_list := '{}';
    upd_list := '{}';

    for col in
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = p_table and column_name <> 'id'
      order by ordinal_position
    loop
      if item ? col.column_name then
        val := item ->> col.column_name;
        if col.column_name = 'url' then
          val := public.safe_social_url(val); -- http(s) only, else ''
        end if;
        col_list := array_append(col_list, '"' || col.column_name || '"');
        val_list := array_append(val_list, quote_nullable(val));
        upd_list := array_append(upd_list, '"' || col.column_name || '" = excluded."' || col.column_name || '"');
      end if;
    end loop;

    if cardinality(col_list) > 0 then
      q := 'insert into public.' || quote_ident(p_table) || ' (id, ' || array_to_string(col_list, ', ') || ') values (' || quote_literal(new_id) || ', ' || array_to_string(val_list, ', ') || ')';
    else
      q := 'insert into public.' || quote_ident(p_table) || ' (id) values (' || quote_literal(new_id) || ')';
    end if;
    q := q || ' on conflict (id) do update set ';
    if cardinality(upd_list) > 0 then
      q := q || array_to_string(upd_list, ', ');
    else
      q := q || 'id = excluded.id';
    end if;

    execute q;
    result := result || jsonb_build_object('id', new_id);
  end loop;

  return result;
end;
$$;

grant execute on function public.admin_save_rows(text, jsonb) to anon, authenticated;

-- ============================================================
-- 10. M9 — STUDENT LOGS: server-derived identity
--     Client-supplied studentId/name/ip/device can no longer be
--     forged. The RPC derives the studentId from the session and
--     caps the lengths of detail/device.
-- ============================================================
create or replace function public.add_student_log(
  p_type text,
  p_detail text,
  p_device text default '',
  p_ip text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sid text;
begin
  sid := public.get_current_student_id();
  if sid is null or sid = '' then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_type is null or p_type = '' then
    p_type := 'EVENT';
  end if;
  insert into public.student_logs ("studentId", name, type, detail, ip, device, timestamp)
  values (
    sid,
    (select name from public.users where "studentId" = sid),
    left(p_type, 50),
    left(coalesce(p_detail, ''), 500),
    left(coalesce(p_ip, public.client_ip()), 64),
    left(coalesce(p_device, ''), 200),
    now()
  );
end;
$$;

grant execute on function public.add_student_log(text, text, text, text) to authenticated;

-- ============================================================
-- 11. VERIFICATION QUERIES (all read-only)
-- ============================================================
-- a) RLS enabled on all tables:
--    select relname, relrowsecurity from pg_class
--      where relname in ('users','courses','lectures','sources','additions',
--                        'subjects','comments','activity','student_logs',
--                        'favorites','ratings','user_stats','settings','request_throttle');
-- b) No open users policy (expect only self/admin read):
--    select policyname, cmd, roles from pg_policies where tablename = 'users';
-- c) Atomic RPCs are authenticated-only now:
--    select p.proname, array_agg(g.grantee) as grantees
--      from pg_proc p
--      join pg_aclitem_to_array(p.proacl) g on true
--      where p.proname in ('toggle_favorite','set_rating','mark_viewed')
--      group by p.proname;
-- d) Hardened link_auth_user is live (expect FORBIDDEN raise for meta-less callers):
--    select pg_get_functiondef('public.link_auth_user(text)'::regprocedure) ilike '%meta_sid is null or meta_sid = ''''%';
-- e) No leftover all-read activity policy:
--    select policyname from pg_policies where tablename = 'activity';
-- f) Reset chain is strict (expect no '@al-azher.local'):
--    select pg_get_functiondef('public.verify_student_email(text,text)'::regprocedure) ilike '%al-azher.local%' as vulnerable;
-- g) Throttle counters are write-only from outside:
--    select has_table_privilege('anon', 'public.request_throttle', 'select') as anon_can_read;  -- expect false
-- h) Password column still unreadable:
--    select "studentId", password from public.users limit 1;  -- must raise permission denied
-- i) Comment read path is name-only (userId not selected):
--    select pg_get_functiondef('public.get_comments_public(text)'::regprocedure);
-- j) Empty-email accounts (need admin reset or auth-email flow):
--    select "studentId", name from public.users where coalesce(email,'') = '';
