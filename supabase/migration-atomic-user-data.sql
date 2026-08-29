-- ============================================================
-- AL-Azher IT Hub — Atomic favorites / ratings / viewed updates
-- Run in the Supabase SQL Editor (once).
--
-- Fixes lost updates caused by client read-modify-write races
-- (two tabs / rapid clicks could silently drop a change). These
-- RPCs do the mutation atomically inside Postgres with row locks.
-- ============================================================

-- Toggle a lecture in the favorites jsonb array
create or replace function public.toggle_favorite(p_student_id text, p_lecture_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids jsonb;
begin
  select coalesce(ids, '[]'::jsonb) into v_ids
    from public.favorites where "studentId" = p_student_id for update;
  if v_ids is null then v_ids := '[]'::jsonb; end if;

  if v_ids ? p_lecture_id then
    v_ids := (select coalesce(jsonb_agg(e), '[]'::jsonb)
              from jsonb_array_elements_text(v_ids) e
              where e <> p_lecture_id);
  else
    v_ids := v_ids || to_jsonb(p_lecture_id);
  end if;

  insert into public.favorites ("studentId", ids)
  values (p_student_id, v_ids)
  on conflict ("studentId") do update set ids = excluded.ids;

  return v_ids;
end;
$$;
grant execute on function public.toggle_favorite(text, text) to anon, authenticated;

-- Set a lecture rating in the ratings jsonb object
create or replace function public.set_rating(p_student_id text, p_lecture_id text, p_rating int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ratings jsonb;
begin
  select coalesce(ratings, '{}'::jsonb) into v_ratings
    from public.ratings where "studentId" = p_student_id for update;
  if v_ratings is null then v_ratings := '{}'::jsonb; end if;

  v_ratings := v_ratings || jsonb_build_object(p_lecture_id, p_rating);

  insert into public.ratings ("studentId", ratings)
  values (p_student_id, v_ratings)
  on conflict ("studentId") do update set ratings = excluded.ratings;

  return v_ratings;
end;
$$;
grant execute on function public.set_rating(text, text, int) to anon, authenticated;

-- Append a lecture to viewed (dedup) and bump lastVisit
create or replace function public.mark_viewed(p_student_id text, p_lecture_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewed jsonb;
begin
  select coalesce(viewed, '[]'::jsonb) into v_viewed
    from public.user_stats where "studentId" = p_student_id for update;
  if v_viewed is null then v_viewed := '[]'::jsonb; end if;

  if not (v_viewed ? p_lecture_id) then
    v_viewed := v_viewed || to_jsonb(p_lecture_id);
  end if;

  insert into public.user_stats ("studentId", viewed, "lastVisit")
  values (p_student_id, v_viewed, now())
  on conflict ("studentId") do update set viewed = excluded.viewed, "lastVisit" = excluded."lastVisit";

  return v_viewed;
end;
$$;
grant execute on function public.mark_viewed(text, text) to anon, authenticated;
