-- AL-Azher IT Hub - Supabase schema
-- Run this once in the Supabase SQL editor. All camelCase columns are quoted
-- ("createdAt", "titleAr", ...) so they match the application's field names
-- exactly (PostgREST resolves JSON keys against the real column names).

create extension if not exists "pgcrypto";

-- ============ USERS ============
create table if not exists users (
  "studentId" text primary key,
  name text not null,
  email text default '',
  major text default '',
  role text default 'student',
  status text default 'active',
  password text not null,
  "createdAt" timestamptz default now(),
  "lastVisit" timestamptz,
  "lastIP" text,
  "lastDevice" text,
  google text,
  linkedin text,
  whatsapp text
);

-- ============ COURSES ============
create table if not exists courses (
  id text primary key default gen_random_uuid()::text,
  "nameAr" text,
  "nameEn" text,
  "doctorAr" text,
  "doctorEn" text,
  lectures jsonb default '[]',
  sources jsonb default '[]',
  "createdAt" timestamptz default now()
);

-- ============ LECTURES ============
create table if not exists lectures (
  id text primary key default gen_random_uuid()::text,
  "courseId" text,
  "titleAr" text,
  "titleEn" text,
  url text,
  date text,
  "subjectAr" text,
  "subjectEn" text,
  "videoId" text,
  "createdAt" timestamptz default now()
);

-- ============ SOURCES ============
create table if not exists sources (
  id text primary key default gen_random_uuid()::text,
  "titleAr" text,
  "titleEn" text,
  url text,
  "subjectAr" text,
  "subjectEn" text,
  "fileData" text,
  "fileName" text,
  "filePath" text,
  files jsonb default '[]',
  date text,
  "createdAt" timestamptz default now()
);

-- ============ ADDITIONS ============
create table if not exists additions (
  id text primary key default gen_random_uuid()::text,
  type text default 'post',
  "subjectAr" text,
  "subjectEn" text,
  "titleAr" text,
  "titleEn" text,
  "descriptionAr" text,
  "descriptionEn" text,
  url text,
  "createdAt" timestamptz default now()
);

-- ============ SUBJECTS ============
create table if not exists subjects (
  id text primary key default gen_random_uuid()::text,
  ar text,
  en text,
  "doctorAr" text,
  "doctorEn" text,
  "createdAt" timestamptz default now()
);

-- ============ COMMENTS ============
create table if not exists comments (
  id text primary key default gen_random_uuid()::text,
  "additionId" text,
  "userId" text,
  "userName" text,
  text text,
  "createdAt" timestamptz default now()
);

create index if not exists comments_addition_idx on comments ("additionId");

-- ============ ACTIVITY ============
create table if not exists activity (
  id text primary key default gen_random_uuid()::text,
  type text,
  action text,
  detail text,
  "studentId" text,
  name text,
  ip text,
  device text,
  timestamp timestamptz default now()
);

-- ============ STUDENT LOGS ============
create table if not exists student_logs (
  id text primary key default gen_random_uuid()::text,
  "studentId" text,
  name text,
  type text,
  detail text,
  ip text,
  device text,
  timestamp timestamptz default now()
);

create index if not exists student_logs_student_idx on student_logs ("studentId");
create index if not exists student_logs_timestamp_idx on student_logs (timestamp desc);

-- ============ FAVORITES ============
create table if not exists favorites (
  "studentId" text primary key,
  ids jsonb default '[]'
);

-- ============ RATINGS ============
create table if not exists ratings (
  "studentId" text primary key,
  ratings jsonb default '{}'
);

-- ============ USER STATS ============
create table if not exists user_stats (
  "studentId" text primary key,
  viewed jsonb default '[]',
  "lastVisit" timestamptz
);

-- ============ SETTINGS ============
create table if not exists settings (
  key text primary key,
  value jsonb
);
