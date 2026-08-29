# Auth migration to Supabase Auth native (P2)

Current: dual auth — `users.password` (PBKDF2 salt:hash) + Supabase Auth (`auth_user_id`). `users.js:authenticateUser` tries `signInWithPassword` then falls back to the `verify_password` / `get_login_profile` RPCs.

Goal: single source — Supabase Auth passwords only.

Status after security consolidation (`supabase/security-consolidated.sql`):
- RLS is enabled on every table, including `users`.
- All anonymous auth reads now go through SECURITY DEFINER RPCs:
  - `get_login_profile(studentId, candidateHash)` / `get_login_profile_by_email(email, candidateHash)` — verify the legacy hash and return the profile only on a match (no PII enumeration).
  - `get_password_salt` / `get_password_salt_by_email` — salt only.
  - `get_session_profile(studentId)` — self/admin restore.
  - `get_profile_by_auth_id(uuid)` / `get_profile_by_email(email)` — post-signIn lookups.
  - `user_exists(studentId)` / `verify_student_email(studentId, email)` — forgot-password (no PII leak).
  - `register_user(...)` — server-validated signup (role forced to `student`).
  - `reset_password(...)` — email now acts as the ownership proof for the anonymous path.
- The client (`src/services/users.js`) uses these RPCs with direct-read fallbacks for tests/pre-migration environments.

Remaining steps to fully drop the legacy hash:
1. Ensure all `users` have `auth_user_id`:
   ```sql
   select "studentId", email, auth_user_id from users where auth_user_id is null;
   ```
2. Backfill missing via `POST /auth/v1/signup` with `email = studentId@al-azher.local` (idempotent). Run `ensureAuthLinked` helper (already tries real email first).
3. Verify: `select count(*) from users where password <> 'legacy:ignore'` should match active users.
4. After 100% backfill, deploy code that removes the `verify_password` / `get_login_profile` fallback (keep RPCs for transition).
5. Rotate: set `users.password = 'legacy:ignore'` via an admin RPC; use `supabase.auth.admin.updateUserById` for auth passwords.
6. Finally `REVOKE EXECUTE ON verify_password, get_password_salt, get_login_profile, get_login_profile_by_email` and `ALTER TABLE users DROP COLUMN password` in a future major.

Rollback: keep the `password` column and the login RPCs until step 6 is confirmed.
