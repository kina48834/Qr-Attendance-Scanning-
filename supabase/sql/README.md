# Supabase SQL — Campus Connect

Run scripts in order in the Supabase SQL Editor, or paste **`00_all_in_one.sql`** once for a fresh project.

## App feature → schema map

| App area | Tables / objects |
|----------|------------------|
| **Login** (`Login.tsx`) | Supabase **Auth** for students/teachers who registered in the app; legacy password check on `public.users` for seeded admin/organiser/teacher/student |
| **Register** (`Register.tsx`) | `users` insert; teachers get `approval_status = pending` + phone, department, `employee_id` |
| **Admin / Teacher user management** | `users` CRUD; approval patch updates `approval_status` |
| **Header profile card** (`AppLayout.tsx`) | `users.public_id` (random numeric user ID), `users.role`, `users.name`, `users.email` |
| **Events** (admin / organiser / teacher forms) | `events`: title, description, location, `start_date`, `end_date`, `organiser_id`, `organiser_name`, `status`, `max_attendees`, `qr_code_data` |
| **Student events & search** | `events` (lists); `event_registrations` for sign-up |
| **Student scan (venue QR)** | `attendance`: one row per `(event_id, user_id)`; `qr_code_data` stores scanned payload |
| **Organiser scan (student QR `ATTEND:…`)** | Same `attendance` row shape; `user_name` / `user_email` from `users` |
| **Dashboards & analytics** | Aggregates over `users`, `events`, `attendance`, `event_registrations` (computed in app) |

## File order (categorized)

Run in this exact order:

1. `01_extensions.sql` — `pgcrypto` (reserved for future hashed passwords / ids)
2. `02_types.sql` — enums: `user_role`, `teacher_approval_status`, `event_status`
3. `03_tables.sql` — `users`, `events`, `attendance`, `event_registrations` + FKs + named unique keys
4. `04_indexes.sql` — query indexes
5. `07_constraints.sql` — **data fixes** for legacy rows, then checks (event dates, teacher staff fields, approval only for teachers). Re-run safe; fixes use placeholders `Not set` / `General` / `TBD-{id}` only where values were missing.
6. `08_triggers.sql` — `events.updated_at` auto-maintained on update
7. `09_comments.sql` — renames legacy `UNIQUE` constraints to `uq_attendance_event_user` / `uq_event_registrations_event_user` if needed, then `COMMENT ON` for documentation
8. `05_rls.sql` — RLS enabled + permissive policies (anon key app; tighten for production)
9. `06_seed.sql` — demo users + sample events: `evt-1` (published), `evt-2` (completed); seed teacher includes `phone` so `chk_users_teacher_staff_fields` passes. The React app does not duplicate this seed in code — it only talks to Postgres via Supabase.
10. `10_auth_public_users_alignment.sql` — optional note: seed `public.users` ids (`admin-1`, …) vs Supabase Auth UUIDs; login tries table password first. Safe to run (returns a single-row `select 1`).

**Merged:** `00_all_in_one.sql` inlines the same order through `09`, then RLS, seed, and the alignment note from `10`.

## Migrations from an older schema

If you already created tables with anonymous `UNIQUE (event_id, user_id)` and need named constraints, drop the old unique constraint in the SQL editor (name shown in **Table Editor → Constraints**) before re-running `03_tables` sections, or `ALTER TABLE ... ADD CONSTRAINT` manually.

## Security note

`password` is stored as plain text to match the current demo app. For production, use Supabase Auth or hash passwords server-side and remove plaintext storage.
