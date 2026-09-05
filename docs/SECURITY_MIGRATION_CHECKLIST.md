# Security Migration — Apply & Verification Checklist

**Files (apply in this order):**
1. `supabase/migration-fix-live-rls.sql` — **URGENT**: closes a live PII leak (`activity` + `student_logs` were readable by anonymous callers, exposing studentId/name/ip/device).
2. `supabase/migration-security-hardening.sql` — IDOR fix, server-side throttling, reset-chain hardening, storage allowlist, comments RPC, student-log RPC.

**Applies to:** the live Supabase project (SQL Editor) — **you** run them; the codebase is only the deliverable.
**Audit context:** `docs/AUDIT_REPORT.md` §6.

Both are **idempotent** (safe to re-run). They depend on helpers that already exist in the codebase's other migrations (`get_current_student_id()`, `is_current_user_admin()`, `safe_social_url()`), so **apply `security-consolidated.sql` first if the live project has never had it applied**.

---

## Step 0 — Determine current live state (read-only)

Run these in the SQL Editor and record the answers:

```sql
-- Which security functions are already live?
select p.proname,
       case when p.proacl is null then 'default(public)' else pg_get_userbyid(p.proowner) end as owner
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_current_student_id','is_current_user_admin',
                    'safe_social_url','throttle_password_attempt','throttle_request',
                    'verify_student_email','link_auth_user','toggle_favorite');
```

- If `throttle_request` already exists → this file was applied before; you can still re-run it.
- If `get_current_student_id` / `is_current_user_admin` / `safe_social_url` are **missing** → apply `security-consolidated.sql` first (it defines them), then this file.
- **Critical live check — PII exposure** (verified open on 2026-08-29):

```sql
set local role anon;
select * from public.activity limit 1;       -- MUST raise permission denied
select * from public.student_logs limit 1;   -- MUST raise permission denied
reset role;
-- If either returns rows, the leak is live — apply migration-fix-live-rls.sql immediately.
```

- RLS state check:

```sql
select relname, relrowsecurity from pg_class
 where relname in ('users','courses','lectures','sources','additions',
                   'subjects','comments','activity','student_logs',
                   'favorites','ratings','user_stats','settings');
-- All rows must show `t`. Any `f` means policies are inert — fix before proceeding.
```

## Step 1 — Apply `supabase/migration-fix-live-rls.sql` (URGENT, first)

Paste the whole file into the SQL Editor and run. It enables RLS on `activity` + `student_logs`, drops every existing policy (including dashboard-created "Enable read access for all users"), and recreates strict admin-read/authenticated-insert policies.

## Step 2 — Apply `supabase/migration-security-hardening.sql`

Paste the whole file into the SQL Editor and run. It is one transactional unit in the editor; if any statement fails, fix and re-run (idempotent).

## Step 3 — Post-apply verification (all read-only)

```sql
-- (a) RLS enabled everywhere incl. the new throttle table
select relname, relrowsecurity from pg_class
 where relname in ('users','comments','activity','student_logs','request_throttle');

-- (b) Users policies are self/admin only
select policyname, cmd, roles from pg_policies where tablename = 'users';

-- (c) Atomic RPCs are authenticated-only (anon revoked)
select p.proname, pg_get_function_result(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('toggle_favorite','set_rating','mark_viewed');

-- (d) Hardened link_auth_user is live (no meta-less claim)
select pg_get_functiondef('public.link_auth_user(text)'::regprocedure) ilike '%meta_sid is null or meta_sid = ''''%' as hardened;

-- (e) No leftover all-read activity policy
select policyname from pg_policies where tablename = 'activity';
-- Expect only activity_admin_read (+ activity_auth_insert if present).

-- (f) Reset chain no longer accepts the synthetic email
select pg_get_functiondef('public.verify_student_email(text,text)'::regprocedure) ilike '%al-azher.local%' as still_vulnerable;
-- Expect false.

-- (g) Throttle table is not readable by anon
select has_table_privilege('anon', 'public.request_throttle', 'select') as anon_can_read; -- expect false

-- (h) Password column still unreadable
select "studentId", password from public.users limit 1; -- must raise permission denied

-- (i) Comments read path is name-only
select pg_get_functiondef('public.get_comments_public(text)'::regprocedure);

-- (j) Accounts with an empty stored email (cannot use anonymous reset now)
select "studentId", name, email from public.users where coalesce(email,'') = '';
```

**Functional smoke tests (after deploy):**
1. Log in with a legacy-format account and with a PBKDF2 account — both must succeed.
2. Try `select public.verify_student_email('real-id', 'real-id@al-azher.local')` → must be `false`.
3. Call `get_comments_public` from the app → comments render with author names; the delete button appears only on the current user's comments.
4. Upload a `.pdf` to the `sources` bucket as admin → allowed. Try uploading a file named `x.html` → must be rejected by the policy.
5. Fire `get_login_profile` with a wrong hash 11+ times within 15 min → expect `TOO_MANY_ATTEMPTS`.
6. Call `mark_viewed` while logged out → expect `NOT_AUTHENTICATED` (anon revoked).

## Step 4 — Coordinated client release

This migration ships with client changes in the same commit. Deploy the app **in the same release** as this SQL, otherwise:

- **If SQL is applied before the new client:** the old client's `getCommentsForAddition` (`.select('*')` on `comments`) still works for read; `addStudentLog` direct inserts still work (policy unchanged). No breakage.
- **If the new client is deployed before the SQL:** `get_comments_public` and `add_student_log` RPCs are missing → comments list and student logs fail (non-fatal, error-bounded in the app). **Apply SQL first, then deploy the client** (or same release).

## Rollback

| Change | Rollback |
|---|---|
| Throttled RPCs | Re-apply `security-consolidated.sql` (redefines them without throttle) |
| IDOR fix + anon revoke | Re-apply `migration-atomic-user-data.sql`, then `grant execute ... to anon` |
| `link_auth_user` | Re-apply `security-fix.sql` |
| Strict reset chain | Re-apply `migration-db-password-reset.sql` |
| Comments RPC + policy | Drop `get_comments_public`; re-create `comments_auth_insert` from `security-consolidated.sql` |
| Storage allowlist | Re-apply `security-consolidated.sql` storage section |
| `add_student_log` | Keep (no client depends on the old direct-insert shape once the new client ships) |

The `request_throttle` table and functions are additive — `drop table public.request_throttle;` removes them if you ever want to.

## Known limitation (documented, accepted)

The anonymous password-reset path still uses the **stored email as ownership proof** (now throttled to 10/15 min per account+IP). This is a managed risk, not a fix: the durable solution is an out-of-band reset (Supabase Auth `resetPasswordForEmail` or an email service) — see `docs/AUDIT_REPORT.md` §11 recommendation #5. Plan it as follow-up work.
