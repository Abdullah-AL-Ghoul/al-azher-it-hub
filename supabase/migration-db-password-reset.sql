-- ============================================================
-- AL-Azher IT Hub — DB-verified password reset (no SMTP needed)
-- Run in the Supabase SQL Editor (once).
--
-- The forgot-password flow now verifies ownership WITHOUT emailing:
--   step 1: student ID exists
--   step 2: the email the user enters matches their account
--   step 3: reset password directly via reset_password RPC
--
-- These updates make the email check accept BOTH the stored
-- email AND the Supabase auth account email, so legacy accounts
-- (created before email was required, stored email = '') can
-- reset using their auth email (studentId@al-azher.local).
-- ============================================================

create or replace function public.verify_student_email(p_student_id text, p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    left join auth.users au on au.id = u.auth_user_id
    where u."studentId" = p_student_id
      and (
        lower(coalesce(u.email, '')) = lower(coalesce(p_email, ''))
        or lower(coalesce(au.email, '')) = lower(coalesce(p_email, ''))
        or lower(p_student_id || '@al-azher.local') = lower(coalesce(p_email, ''))
      )
  )
$$;

create or replace function public.reset_password(p_student_id text, p_new_hashed text, p_email text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_email text;
  auth_email text;
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

  select lower(coalesce(u.email, '')), lower(coalesce(au.email, ''))
    into stored_email, auth_email
    from public.users u
    left join auth.users au on au.id = u.auth_user_id
    where u."studentId" = p_student_id;

  if (stored_email is null or stored_email = '' or stored_email <> lower(p_email))
     and (auth_email is null or auth_email = '' or auth_email <> lower(p_email))
     and lower(p_email) <> lower(p_student_id || '@al-azher.local') then
    raise exception 'FORBIDDEN';
  end if;

  update public.users set password = p_new_hashed where "studentId" = p_student_id;
end;
$$;
