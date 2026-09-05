-- ============================================================
-- PERFORMANCE INDEXES — AL-Azher IT Hub (2026-09-04)
-- Every public list query orders by "createdAt" desc
-- (createCrudService.getAll), and comments/logs filter by their
-- foreign keys. These indexes make those paths index-scans as
-- the tables grow. Idempotent; safe to re-run.
-- ============================================================

create index if not exists lectures_created_idx
  on public.lectures ("createdAt" desc);

create index if not exists sources_created_idx
  on public.sources ("createdAt" desc);

create index if not exists additions_created_idx
  on public.additions ("createdAt" desc);

create index if not exists courses_created_idx
  on public.courses ("createdAt" desc);

-- comments_addition_idx already exists (schema.sql); add the ordering aid:
create index if not exists comments_addition_created_idx
  on public.comments ("additionId", "createdAt" desc);

-- activity lookups by type (admin dashboard filters)
create index if not exists activity_timestamp_idx
  on public.activity (timestamp desc);

-- user-scoped rating/favorite analytics in the admin overview read
-- the whole jsonb row by PK — no extra index needed there.

-- ============================================================
-- VERIFICATION
-- ============================================================
-- select indexname from pg_indexes
--  where schemaname = 'public'
--    and indexname in ('lectures_created_idx','sources_created_idx',
--                      'additions_created_idx','courses_created_idx',
--                      'comments_addition_created_idx','activity_timestamp_idx');
