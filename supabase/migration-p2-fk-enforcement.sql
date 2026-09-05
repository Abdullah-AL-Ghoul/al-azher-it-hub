-- P2 migration: FK enforcement (run ONLY after data is clean)
-- Validate orphans first:
-- select * from lectures where "courseId" is not null and "courseId" not in (select id from courses);
-- select * from comments where "additionId" not in (select id from additions);

-- FK: lectures.courseId -> courses.id (SET NULL on delete)
do $$ begin
  if not exists (select 1 from pg_constraint where conname='lectures_course_fk') then
    alter table public.lectures add constraint lectures_course_fk foreign key ("courseId") references public.courses(id) on delete set null on update cascade;
  end if;
end $$;

-- FK: comments.additionId -> additions.id (CASCADE)
do $$ begin
  if not exists (select 1 from pg_constraint where conname='comments_addition_fk') then
    alter table public.comments add constraint comments_addition_fk foreign key ("additionId") references public.additions(id) on delete cascade on update cascade;
  end if;
end $$;

-- FK: favorites.studentId -> users.studentId
do $$ begin
  if not exists (select 1 from pg_constraint where conname='favorites_user_fk') then
    alter table public.favorites add constraint favorites_user_fk foreign key ("studentId") references public.users("studentId") on delete cascade;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='ratings_user_fk') then
    alter table public.ratings add constraint ratings_user_fk foreign key ("studentId") references public.users("studentId") on delete cascade;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='user_stats_user_fk') then
    alter table public.user_stats add constraint user_stats_user_fk foreign key ("studentId") references public.users("studentId") on delete cascade;
  end if;
end $$;

-- Backup guidance:
-- In Supabase Dashboard > Database > Backups: enable PITR (7 days).
-- For daily dump: pg_dump --schema=public with storage to S3. Test restore monthly.
