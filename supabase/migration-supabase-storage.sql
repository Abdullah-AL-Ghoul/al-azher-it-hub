-- ============================================================
-- AL-Azher IT Hub — Supabase Storage bucket for sources
-- Run this in the Supabase SQL Editor (once).
-- Creates the "sources" bucket and its security policies.
-- ============================================================

-- 1) Create the public bucket
insert into storage.buckets (id, name, public)
values ('sources', 'sources', true)
on conflict (id) do nothing;

-- 2) Allow anyone to read/download files (needed for student downloads)
drop policy if exists "sources_public_read" on storage.objects;
create policy "sources_public_read" on storage.objects
  for select using (bucket_id = 'sources');

-- 3) Uploads: admin-only — matches migration-security-hardening.sql's
--    "sources_admin_upload" (with the extension/mimetype allowlist there).
--    The previous "authenticated" variant let any student upload to the
--    bucket; it is dropped here so the two files can never disagree.
drop policy if exists "sources_auth_upload" on storage.objects;
drop policy if exists "sources_admin_upload" on storage.objects;
create policy "sources_admin_upload" on storage.objects
  for insert with check (bucket_id = 'sources' and public.is_current_user_admin());

-- 4) Allow admins to update/delete files
drop policy if exists "sources_admin_delete" on storage.objects;
create policy "sources_admin_delete" on storage.objects
  for delete using (bucket_id = 'sources' and public.is_current_user_admin());

drop policy if exists "sources_admin_update" on storage.objects;
create policy "sources_admin_update" on storage.objects
  for update using (bucket_id = 'sources' and public.is_current_user_admin());
