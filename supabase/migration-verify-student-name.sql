-- ============================================================
-- AL-Azher IT Hub — Verify student name (extra ownership proof)
-- Run in the Supabase SQL Editor (once).
--
-- Adds a verify_student_name RPC used by the forgot-password flow
-- as an additional step: after the student ID and email match,
-- the student must also enter their registered full name.
-- ============================================================

create or replace function public.verify_student_name(p_student_id text, p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where "studentId" = p_student_id
      and lower(replace(coalesce(name, ''), ' ', ''))
          = lower(replace(coalesce(p_name, ''), ' ', ''))
  )
$$;

grant execute on function public.verify_student_name(text, text) to anon, authenticated;
