-- ============================================================================
-- REVIEW-ONLY PATCH — do not run blindly; read steps below.
-- Target findings (multi-agent audit, 2026-08-23):
--   [HIGH] verify_password / get_password_salt are anonymous, unthrottled
--          oracles (supabase/security-fix.sql:134-158). get_password_salt also
--          leaks account existence (NULL = unknown ID vs hex = real user).
--   [P0]   Verify RLS state first — run the checks at the bottom of
--          supabase/security-consolidated.sql (lines ~382-384). If
--          `security-consolidated.sql` was never applied, apply it BEFORE
--          this patch; otherwise every finding labeled "State B" is live.
--
-- This patch is CLIENT-COMPATIBLE by design:
--   * get_password_salt now returns '' (the "legacy" marker) for UNKNOWN
--     accounts and for throttled callers, removing the existence signal
--     without changing the response contract.
--   * verify_password raises 'TOO_MANY_ATTEMPTS' once the sliding window
--     threshold is hit. The client already maps RPC errors to a generic
--     LOGIN_ERROR message (src/services/users.js -> AuthContext.login catch).
--
-- Rollout order:
--   1. Apply this file in Supabase SQL editor (idempotent).
--   2. Watch password_attempts table for abuse patterns.
--   3. Longer-term: migrate all users to Supabase Auth passwords per
--      docs/auth-migration.md, then REVOKE these RPCs from anon entirely.
-- ============================================================================

create table if not exists public.password_attempts (
  student_id text primary key,
  attempts int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.password_attempts enable row level security;

-- No policies: accessible only via SECURITY DEFINER functions below.
revoke all on public.password_attempts from anon, authenticated;

create or replace function public.throttle_password_attempt(
  p_student_id text,
  p_max_attempts int default 8,
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
  insert into password_attempts (student_id, attempts, window_start)
  values (p_student_id, 0, now())
  on conflict (student_id) do nothing;

  select attempts, window_start into v_attempts, v_window_start
  from password_attempts
  where student_id = p_student_id
  for update;

  if v_window_start < now() - make_interval(mins => p_window_minutes) then
    update password_attempts
    set attempts = 0, window_start = now()
    where student_id = p_student_id;
    v_attempts := 0;
  end if;

  if v_attempts >= p_max_attempts then
    raise exception 'TOO_MANY_ATTEMPTS'
      using errcode = 'P0001';
  end if;

  update password_attempts
  set attempts = attempts + 1
  where student_id = p_student_id;

  return v_attempts + 1;
end;
$$;

create or replace function public.clear_password_attempts(p_student_id text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from password_attempts where student_id = p_student_id;
$$;

-- ---------------------------------------------------------------------------
-- Hardened wrappers. Names match the existing client contract exactly.
-- ---------------------------------------------------------------------------

create or replace function public.get_password_salt(p_student_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salt text;
begin
  perform public.throttle_password_attempt('salt:' || coalesce(p_student_id, ''));

  select split_part(u.password, ':', 1)
    into v_salt
    from users u
   where u.student_id = p_student_id;

  -- '' = legacy unsalted marker; unknown users MUST look identical to
  -- throttled users to avoid leaking account existence.
  if v_salt is null or v_salt = '' then
    return '';
  end if;

  return v_salt;
end;
$$;

create or replace function public.verify_password(p_student_id text, p_candidate_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hashed text;
  v_ok boolean := false;
begin
  perform public.throttle_password_attempt(coalesce(p_student_id, ''));

  select password into v_hashed from users where student_id = p_student_id;
  if v_hashed is not null and length(p_candidate_hash) >= 10 then
    v_ok := v_hashed = p_candidate_hash
            or v_hashed = 'sha256:' || p_candidate_hash;
  end if;

  if v_ok then
    perform public.clear_password_attempts(p_student_id);
  end if;

  return v_ok;
end;
$$;

revoke all on function public.get_password_salt(text) from public;
revoke all on function public.verify_password(text, text) from public;
grant execute on function public.get_password_salt(text) to anon, authenticated;
grant execute on function public.verify_password(text, text) to anon, authenticated;

-- Sanity checks after applying:
--   select relrowsecurity from pg_class where relname = 'users';            -- must be true
--   select count(*) from pg_policies where tablename = 'users';             -- consolidated policies present
--   select get_password_salt('definitely-not-a-real-id');                   -- must return '' (empty), not NULL
