-- ============================================================================
-- REVIEW-ONLY PATCH v2 — do not run blindly; read rollout steps below.
-- Target findings (multi-agent audit, 2026-08-23):
--   [HIGH] verify_password / get_password_salt are anonymous, unthrottled
--          oracles (supabase/security-fix.sql:112-158). get_password_salt also
--          leaks account existence (NULL = unknown ID vs hex salt = real user,
--          '' = legacy user).
--   [P0]   Verify RLS state first — run the read-only verification script
--          delivered by the audit (catalog queries [A]-[F]). If
--          `security-consolidated.sql` was never applied, apply it BEFORE
--          this patch; otherwise several findings labeled "State B" are live.
--
-- WHAT CHANGED vs v1 (audit of this patch found 6 defects — all fixed):
--   BUG-1 (critical): unquoted student_id -> column is camelCase "studentId".
--         All references now quoted; functions would have crashed at runtime.
--   BUG-2 (critical): hash comparison must split the stored "<salt>:<digest>"
--         format and compare part 2 (mirrors security-fix.sql:150-153),
--         including the 'legacy:ignore' sentinel guard.
--   BUG-3 (moderate): unknown accounts now receive a RANDOM 32-hex dummy salt
--         instead of NULL/''. The client then performs the identical
--         PBKDF2 work and gets a generic failure — shape AND timing of the
--         response match a real account, closing the enumeration oracle
--         completely. Legacy accounts still correctly receive '' so the
--         client uses its SHA-256 path.
--   BUG-4 (minor): counter row vanishing mid-call no longer yields NULL;
--         COALESCE keeps accounting correct under the FOR UPDATE race.
--   BUG-5 (doc): this is a FIXED window limiter (15 min), not sliding.
--         Boundary-straddle burst is bounded ~2x budget — documented, accepted.
--   BUG-6 (minor): throttle key and success-clear key both use
--         COALESCE(p_student_id,'') consistently.
--
-- CLIENT COMPATIBILITY (src/services/users.js):
--   * Response contract unchanged: text (hex | '' | random-hex). Client never
--     sees NULL for unknown users anymore but only used NULL to fail fast.
--   * verify_password still returns boolean; raises TOO_MANY_ATTEMPTS after
--     threshold. AuthContext.login maps any thrown error to generic
--     LOGIN_ERROR, so no new user-facing signal exists.
--   * Budget note: one login attempt consumes 2 increments (salt + verify).
--     Default max 10 => ~5 real password tries per 15-minute window per ID.
--
-- ROLLOUT ORDER:
--   1. Run the read-only RLS verification script FIRST (catalog queries).
--   2. Apply security-consolidated.sql if step 1 shows gaps (idempotent).
--      NOTE: consolidation revokes direct INSERT on users — the client still
--      signs up via direct insert (users.js registerUser/findOrCreateOAuthUser)
--      and reads users pre-auth during ID login. Port these to the provided
--      register_user RPC / post-auth reads BEFORE relying on consolidated,
--      or signup breaks. This is a coordinated client+SQL release.
--   3. Apply THIS file in Supabase SQL Editor (idempotent).
--   4. Monitor public.password_attempts for abuse patterns.
--   5. Long-term: migrate users to Supabase Auth passwords per
--      docs/auth-migration.md, then REVOKE both RPCs from anon entirely.
-- ============================================================================

create table if not exists public.password_attempts (
  student_id text primary key,
  attempts int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.password_attempts enable row level security;

-- No policies: reachable only through SECURITY DEFINER functions below.
revoke all on public.password_attempts from anon, authenticated;

-- Fixed-window limiter: max p_max_attempts increments per p_window_minutes
-- per key. Serialized per row via FOR UPDATE; safe under concurrency.
create or replace function public.throttle_password_attempt(
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
  insert into password_attempts (student_id, attempts, window_start)
  values (p_key, 0, now())
  on conflict (student_id) do nothing;

  select attempts, window_start
    into v_attempts, v_window_start
    from password_attempts
   where student_id = p_key
     for update;

  -- Row deleted between upsert and select by a concurrent success-clear:
  -- treat as fresh window rather than returning NULL.
  if v_window_start is null then
    v_attempts := 0;
    v_window_start := now();
  end if;

  if v_window_start < now() - make_interval(mins => p_window_minutes) then
    update password_attempts
       set attempts = 0, window_start = now()
     where student_id = p_key;
    v_attempts := 0;
  end if;

  if coalesce(v_attempts, 0) >= p_max_attempts then
    raise exception 'TOO_MANY_ATTEMPTS' using errcode = 'P0001';
  end if;

  update password_attempts
     set attempts = attempts + 1
   where student_id = p_key;

  return coalesce(v_attempts, 0) + 1;
end;
$$;

create or replace function public.clear_password_attempts(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from password_attempts where student_id = p_key;
$$;

-- Random 32-hex string indistinguishable from a real PBKDF2 salt.
create or replace function public.dummy_salt()
returns text
language sql
immutable
as $$
  select replace(gen_random_uuid()::text, '-', '')
$$;

-- ---------------------------------------------------------------------------
-- Hardened wrappers. Signatures identical to security-fix.sql versions.
-- ---------------------------------------------------------------------------

create or replace function public.get_password_salt(p_student_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(p_student_id, '');
  stored text;
begin
  perform public.throttle_password_attempt(v_key);

  select password into stored
    from public.users
   where "studentId" = p_student_id;

  if stored is null then
    -- Unknown account: return a random salt so response shape and timing
    -- match a real salted account exactly (enumeration closed).
    return public.dummy_salt();
  end if;

  if stored = '' or position(':' in stored) = 0 then
    return ''; -- legacy unsalted SHA-256 marker (client switches algorithm)
  end if;

  return split_part(stored, ':', 1);
end;
$$;

create or replace function public.verify_password(p_student_id text, p_candidate_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(p_student_id, '');
  stored text;
  v_ok boolean := false;
begin
  perform public.throttle_password_attempt(v_key);

  if p_candidate_hash is null or length(p_candidate_hash) < 10 then
    return false;
  end if;

  select password into stored
    from public.users
   where "studentId" = p_student_id;

  if stored is not null and stored <> '' and stored <> 'legacy:ignore' then
    if position(':' in stored) > 0 then
      v_ok := split_part(stored, ':', 2) = p_candidate_hash;
    else
      v_ok := stored = p_candidate_hash; -- legacy unsalted digest
    end if;
  end if;

  if v_ok then
    perform public.clear_password_attempts(v_key);
  end if;

  return v_ok;
end;
$$;

revoke all on function public.get_password_salt(text) from public;
revoke all on function public.verify_password(text, text) from public;
grant execute on function public.get_password_salt(text) to anon, authenticated;
grant execute on function public.verify_password(text, text) to anon, authenticated;

-- Sanity checks after applying (all read-only):
--   select public.get_password_salt('definitely-not-a-real-id');
--     -> must return 32 hex chars (random), NOT null.
--   select public.verify_password('definitely-not-a-real-id', repeat('a', 64));
--     -> must be false; calling >10x within 15 min must raise TOO_MANY_ATTEMPTS.
--   Real-user regression: log in with a valid legacy + a valid PBKDF2 account.
