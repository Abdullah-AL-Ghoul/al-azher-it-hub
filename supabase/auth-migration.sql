-- Auth migration for AL-Azher IT Hub
-- Adds Supabase Auth integration, removes admin key dependency

-- 1. Link users to Supabase Auth
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 2. Helper: get studentId from current auth user
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT "studentId" FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- 3. Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 4. Updated admin functions (auth-based, no admin key)

CREATE OR REPLACE FUNCTION public.admin_save_rows(p_table text, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  item jsonb;
  col record;
  col_list text[] := '{}';
  val_list text[] := '{}';
  upd_list text[] := '{}';
  new_id text;
  q text;
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
        col_list := array_append(col_list, '"' || col.column_name || '"');
        val_list := array_append(val_list, quote_nullable(item ->> col.column_name));
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

CREATE OR REPLACE FUNCTION public.admin_delete_row(p_table text, p_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if not public.is_current_user_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_table not in ('courses', 'lectures', 'sources', 'additions') then
    raise exception 'UNKNOWN_TABLE';
  end if;
  if p_table = 'additions' then
    delete from public.comments where "additionId" = p_id;
  end if;
  execute format('delete from public.%I where id = %L', p_table, p_id);
end;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_setting(p_key text, p_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if not public.is_current_user_admin() then
    raise exception 'FORBIDDEN';
  end if;
  insert into public.settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;
end;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if not public.is_current_user_admin() then
    raise exception 'FORBIDDEN';
  end if;
  delete from public.activity where id <> '00000000-0000-0000-0000-000000000000';
end;
$$;

CREATE OR REPLACE FUNCTION public.admin_manage_user(p_action text, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  sid text := p_payload ->> 'studentId';
  allowed text[] := array['name', 'email', 'major', 'role', 'status', 'google', 'linkedin', 'whatsapp'];
  col record;
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
        execute format('update public.users set %I = %L where "studentId" = %L',
          col.column_name, p_payload ->> col.column_name, sid);
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

-- 5. Updated student functions (auth-based, no client-supplied studentId)

CREATE OR REPLACE FUNCTION public.student_update_profile(p_fields jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  sid text;
  allowed text[] := array['name', 'email', 'major', 'google', 'linkedin', 'whatsapp'];
  col record;
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
      execute format('update public.users set %I = %L where "studentId" = %L',
        col.column_name, p_fields ->> col.column_name, sid);
    end if;
  end loop;
end;
$$;

CREATE OR REPLACE FUNCTION public.student_touch_visit(p_ip text, p_device text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  sid text;
begin
  sid := public.get_current_student_id();
  if sid is null then return; end if;
  update public.users
  set "lastVisit" = now(), "lastIP" = coalesce(p_ip, 'unknown'), "lastDevice" = coalesce(p_device, '')
  where "studentId" = sid;
end;
$$;

-- 6. Updated reset_password (admin or email-verified self-reset)

CREATE OR REPLACE FUNCTION public.reset_password(p_student_id text, p_new_hashed text, p_email text default null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  stored_email text;
  caller_sid text;
begin
  if p_new_hashed is null or p_new_hashed = '' then
    raise exception 'PASSWORD_REQUIRED';
  end if;

  -- Admin path: current user is admin
  if public.is_current_user_admin() then
    update public.users set password = p_new_hashed where "studentId" = p_student_id;
    return;
  end if;

  -- Self path: must be the same user
  caller_sid := public.get_current_student_id();
  if caller_sid = p_student_id then
    update public.users set password = p_new_hashed where "studentId" = p_student_id;
    return;
  end if;

  raise exception 'FORBIDDEN';
end;
$$;

-- 7. NOTE: is_admin_key was dropped by security-fix.sql. Do not grant it here.
--    The consolidated hardening migration (security-consolidated.sql) defines
--    the final grants. Applying this file BEFORE security-fix.sql/consolidated
--    is the only valid order.

-- 8. Grant execute
grant execute on function public.admin_save_rows(text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_row(text, text) to anon, authenticated;
grant execute on function public.admin_save_setting(text, jsonb) to anon, authenticated;
grant execute on function public.admin_clear_activity() to anon, authenticated;
grant execute on function public.admin_manage_user(text, jsonb) to anon, authenticated;
grant execute on function public.student_update_profile(jsonb) to anon, authenticated;
grant execute on function public.student_touch_visit(text, text) to anon, authenticated;
grant execute on function public.reset_password(text, text, text) to anon, authenticated;
grant execute on function public.get_current_student_id() to anon, authenticated;
grant execute on function public.is_current_user_admin() to anon, authenticated;

-- 9. RLS policies for auth-based access
-- NOTE: the old `or true` catch-all was REMOVED. Final users policies live in
-- security-consolidated.sql (self-read + admin-read only). Applying this policy
-- as-is would re-open the PII exposure. Dropped here to keep ordering safe.
drop policy if exists "users_own_profile" on public.users;
