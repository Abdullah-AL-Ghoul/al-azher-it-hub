-- P1 migration: indexes, constraints, FKs, de-duplication
-- Apply AFTER schema.sql and security-fix.sql in Supabase SQL Editor

-- 1. Users constraints + indexes
alter table public.users add constraint users_role_check check (role in ('student','admin'));
alter table public.users add constraint users_status_check check (status in ('active','suspended','pending'));
create unique index if not exists users_email_unique on public.users (lower(email)) where email <> '';
create index if not exists users_role_idx on public.users (role);
create index if not exists users_created_idx on public.users ("createdAt" desc);

-- 2. Lectures: FK + indexes + constraints
create index if not exists lectures_course_idx on public.lectures ("courseId");
create index if not exists lectures_subject_ar_idx on public.lectures ("subjectAr");
create index if not exists lectures_date_idx on public.lectures (date desc);
create index if not exists lectures_created_idx on public.lectures ("createdAt" desc);
-- soft FK (no hard constraint to avoid existing orphan breakage); enforce via trigger or use FK if data clean:
-- alter table public.lectures add constraint lectures_course_fk foreign key ("courseId") references public.courses(id) on delete set null;

-- 3. Sources indexes
create index if not exists sources_subject_ar_idx on public.sources ("subjectAr");
create index if not exists sources_date_idx on public.sources (date desc);

-- 4. Additions + comments
create index if not exists additions_type_idx on public.additions (type);
create index if not exists additions_created_idx on public.additions ("createdAt" desc);
create index if not exists comments_user_idx on public.comments ("userId");
create index if not exists comments_created_idx on public.comments ("createdAt" desc);
-- FK for comments (soft)
-- alter table public.comments add constraint comments_addition_fk foreign key ("additionId") references public.additions(id) on delete cascade;

-- 5. Activity + student_logs additional indexes
create index if not exists activity_student_idx on public.activity ("studentId");
create index if not exists activity_timestamp_idx on public.activity (timestamp desc);
create index if not exists activity_type_idx on public.activity (type);

-- 6. Favorites / ratings / user_stats: add updatedAt for cache invalidation
alter table public.favorites add column if not exists "updatedAt" timestamptz default now();
alter table public.ratings add column if not exists "updatedAt" timestamptz default now();
alter table public.user_stats add column if not exists "updatedAt" timestamptz default now();

-- 7. Optional: remove jsonb duplication in courses (migrate to view)
-- Keep columns but add comment for future drop:
comment on column public.courses.lectures is 'DEPRECATED: use lectures table with courseId; will be removed in v2';
comment on column public.courses.sources is 'DEPRECATED: use sources table; will be removed in v2';

-- 8. Settings: ensure RLS
alter table public.settings enable row level security;
