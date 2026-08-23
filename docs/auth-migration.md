# Auth migration to Supabase Auth native (P2)

Current: dual auth — `users.password` (PBKDF2 salt:hash) + Supabase Auth (`auth_user_id`). `users.js:authenticateUser` tries `signInWithPassword` then falls back to `verify_password` RPC.

Goal: single source — Supabase Auth passwords only.

Steps:
1. Ensure all `users` have `auth_user_id`:
   ```sql
   select "studentId", email, auth_user_id from users where auth_user_id is null;
   ```
2. Backfill missing via `POST /auth/v1/signup` with `email = studentId@al-azher.local` (idempotent). Run `ensureAuthLinked` helper.
3. Verify: `select count(*) from users where password <> 'legacy:ignore'` should match active users.
4. After 100% backfill, deploy code that removes `verify_password` fallback (keep RPC for transition).
5. Rotate: set `users.password = 'legacy:ignore'` via RPC `reset_password` no longer writes custom hash; instead use `supabase.auth.admin.updateUserById`.
6. Finally `REVOKE EXECUTE ON verify_password, get_password_salt` and `ALTER TABLE users DROP COLUMN password` in future major.

Rollback: keep `password` column until step 6 confirmed.
