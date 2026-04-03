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
| **Student Reminders** (`/student/notifications`) | Same as app: `events` + `attendance`; optional SQL `student_events_open_no_attendance`, `student_events_missed_no_attendance`, `student_reminders_count` (`14_…sql`) |
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
9. `11_api_grants.sql` — `GRANT` on `public.users` / `events` / `attendance` / `event_registrations` for `anon` + `authenticated` (fixes “cannot read users” if tables were created only via SQL)
10. `14_student_event_reminder_functions.sql` — optional RPCs for student open / missed events (same rules as Reminders page)
11. `06_seed.sql` — demo users + **one** pre-seeded **welcome** event (`evt-1`, *Welcome to Campus Connect*, organiser-owned, published) + sample attendance for the demo student; removes legacy `evt-2`…`evt-6` if present. Teacher includes `phone` so `chk_users_teacher_staff_fields` passes.
12. `10_auth_public_users_alignment.sql` — note on seed ids vs Supabase Auth UUIDs; safe to run (`select 1`).
13. `12_verify_demo_users.sql` — optional diagnostics: lists `public.users` with a short password preview.
14. `13_repair_demo_login_users.sql` — **optional** one-off repair: normalizes demo emails, resets seed passwords to match `06_seed.sql`, ensures seed teacher is `approved`. Use if table-password login fails but rows exist.

**Merged:** `00_all_in_one.sql` inlines **01–04**, **07–09**, **05** (RLS), **11** (grants), **14** (student reminder RPCs), **06** (seed), **10** (auth note + `select 1`), **12** (verify `select`), and ends with **13** as a **commented** repair block (uncomment or run `13_repair_demo_login_users.sql` separately — do not run `13` on top of a fresh seed in the same pass).

### Login / register troubleshooting

- **Seeded table-password accounts**: Rows must exist in **`public.users`** (emails such as `admin@gmail.com`, …) — run `06_seed.sql` (or `00_all_in_one.sql`) in the Supabase SQL Editor. Passwords are set only in the database (not shown in the app). The app checks this table **before** Supabase Auth.
- **Verify rows**: Run `12_verify_demo_users.sql` or `select id, email, role from public.users order by email;`. Expect `admin-1`, `org-1`, `tea-1`, `stu-1`. An empty table means the seed `INSERT` did not run.
- **SIGNED_OUT vs demo login**: `signOut()` can emit `SIGNED_OUT` after table-password login. The app clears stored session on that event only when the user id looks like a Supabase Auth **UUID**; ids like `admin-1` are not cleared so demo login sticks.
- **Stale Auth on load**: If localStorage has a demo profile but the browser still has another Supabase session, the app signs out of Supabase on load and keeps the demo profile.
- **Table-password login still fails**: Run **`13_repair_demo_login_users.sql`** to fix email casing and reset the four seed passwords to match `06_seed.sql`, and ensure the seed teacher is `approved`. The app signs out of Supabase **only after** a successful table-password match (not at the start of the form), then applies your session so roles route correctly.
- **New registrations**: Under **Authentication → Providers → Email**, disable **Confirm email** for local testing, or confirm the inbox before signing in. Profile rows use **`public.users.id` = Auth user UUID**; `email` is stored lowercase.

## Migrations from an older schema

If you already created tables with anonymous `UNIQUE (event_id, user_id)` and need named constraints, drop the old unique constraint in the SQL editor (name shown in **Table Editor → Constraints**) before re-running `03_tables` sections, or `ALTER TABLE ... ADD CONSTRAINT` manually.

## Security note

`password` is stored as plain text to match the current demo app. For production, use Supabase Auth or hash passwords server-side and remove plaintext storage.
