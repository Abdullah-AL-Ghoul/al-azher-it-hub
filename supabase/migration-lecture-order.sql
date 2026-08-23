-- ============================================================
-- AL-Azher IT Hub — Manual ordering field
-- Run this in the Supabase SQL Editor (once).
-- Gives admins full control over lecture/source ordering.
-- ============================================================

alter table public.lectures add column if not exists "sortOrder" integer default 0;
alter table public.sources  add column if not exists "sortOrder" integer default 0;

-- Doctor fields (Arabic + English) so lecture cards can show the instructor
alter table public.lectures add column if not exists "doctorAr" text;
alter table public.lectures add column if not exists "doctorEn" text;

create index if not exists lectures_sort_idx on public.lectures ("sortOrder", date desc, "createdAt" desc);
create index if not exists sources_sort_idx  on public.sources  ("sortOrder", date desc, "createdAt" desc);
