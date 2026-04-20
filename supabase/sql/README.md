# Supabase SQL — Campus Connect

Run scripts in order in the Supabase SQL Editor, or paste **`00_all_in_one.sql`** once for a fresh project.

## App feature → schema map

| App area | Tables / objects |
|----------|------------------|
| **Login** (`Login.tsx`) | Supabase **Auth** for registered students/teachers + legacy table-password for seeded accounts; student/teacher sign-in allowed only when `approval_status = approved` (pending/rejected blocked with notice) |
| **Student attendance history** (`/student/history`) | `attendance.scanned_at` = first organiser scan (time in); **`attendance.time_out_at`** = second scan of same student event QR (time out); rosters/exports show both |
| **Register** (`Register.tsx`) | Supabase Auth sign-up + `public.users` row (`id` = Auth UUID); self-registered students/teachers start `approval_status = pending`; DB trigger **`18_handle_new_auth_user.sql`** keeps Auth and `public.users` in sync if the client upsert fails; duplicate-email registration shows role-aware notice; **Department** UI uses interactive buttons (track / year + JH section / SH strand / college program) |
| **Admin user management** | `users` CRUD (`AdminUsers.tsx`); same Department UI as Register with interactive section/strand/program buttons; approve/reject both student and teacher pending accounts |
| **Header profile card** (`AppLayout.tsx`) | `users.public_id` (random numeric user ID), `users.role`, `users.name`, `users.email` |
| **Student / teacher profile** | `users.academic_*` + formatted `department`; run **`15_academic_enrollment_columns.sql`** on existing DBs (or full `07` / `00_all_in_one`) |
| **Events** | `events` table; **create** via admin / organiser / teacher UIs; legacy unique `events.qr_code_data` (EVT-…) kept in DB; **attendance** uses student personal QR `ATTEND:userId:eventId`; past `start_date` / `end_date` blocked in app and DB trigger `trg_events_validate_future_dates` (see `08_triggers.sql`) |
| **Student events & search** | `events` (lists); `event_registrations` for sign-up |
| **Student Reminders** (`/student/notifications`) | Same as app: `events` + `attendance`; optional SQL `student_events_open_no_attendance`, `student_events_missed_no_attendance`, `student_reminders_count` (`14_…sql`) |
| **Student My QR** (`/student/show-qr`) | Student shows/downloads personal `ATTEND:userId:eventId` per event; no venue QR scan in app |
| **Organiser / event owner scan** | First scan inserts `attendance` (time in); second scan sets `time_out_at`; `qr_code_data` stores scanned string |
| **Attendance rosters (admin / teacher / organiser)** | Grouped by `users.academic_track` / `academic_year` / `academic_program`; PDF/Excel include **Department** + **Grade level** + **Section/Strand/Program**; per-level exports; college-program-only exports; optional view `v_attendance_with_user_enrollment` (`16_…sql`) |
| **Dashboards & analytics** | Aggregates over `users`, `events`, `attendance`, `event_registrations` (computed in app) |

## File order (categorized)

Run in this exact order:

1. `01_extensions.sql` — `pgcrypto` (reserved for future hashed passwords / ids)
2. `02_types.sql` — enums: `user_role`, `teacher_approval_status`, `event_status`
3. `03_tables.sql` — `users`, `events`, `attendance`, `event_registrations` + FKs + named unique keys
4. `04_indexes.sql` — query indexes (includes `idx_users_academic_roster` for enrollment sort used on rosters & Admin Users; client-side expand/collapse plus asc/desc toggles for subgroups/names sit on top of this default order)
5. `07_constraints.sql` — **data fixes** for legacy rows, then checks (event dates, teacher staff fields, student/teacher approval). Re-run safe; fixes use placeholders `Not set` / `General` / `TBD-{id}` only where values were missing.
6. `08_triggers.sql` — `events.updated_at` auto-maintained on update; `trg_events_validate_future_dates` on **insert** allows `completed` (historical dates) and **published** rows still open (`end_date >= now()`) with `start_date` in the past; otherwise requires future start/end. **Update**: blocks moving dates into the past while the event is not fully ended.
7. `09_comments.sql` — renames legacy `UNIQUE` constraints to `uq_attendance_event_user` / `uq_event_registrations_event_user` if needed, then `COMMENT ON` for documentation
8. `05_rls.sql` — RLS enabled + permissive policies (anon key app; tighten for production)
9. `11_api_grants.sql` — `GRANT` on `public.users` / `events` / `attendance` / `event_registrations` for `anon` + `authenticated` (fixes “cannot read users” if tables were created only via SQL)
10. `14_student_event_reminder_functions.sql` — optional RPCs for student open / missed events (same rules as Reminders page)
11. `15_academic_enrollment_columns.sql` — `users.academic_track` / `academic_year` / `academic_program` + `chk_users_academic_shape` (also merged into `07_constraints.sql` / `00_all_in_one.sql`)
12. `16_attendance_enrollment_view.sql` — `v_attendance_with_user_enrollment` (`attendance` LEFT JOIN `users` for reporting)
13. `06_seed.sql` — demo users (`admin-1`, `org-1`, `tea-1`, `stu-1`; demo student **approved** + college enrollment) + **six** demo events (`evt-1`…`evt-6`: published, draft, completed, teacher-owned) + registrations + sample attendance so **Students / Events** and all roles show real rows. Re-run safe.
14. `10_auth_public_users_alignment.sql` — note on seed ids vs Supabase Auth UUIDs; safe to run (`select 1`).
15. `12_verify_demo_users.sql` — optional diagnostics: lists `public.users` with a short password preview.
16. `13_repair_demo_login_users.sql` — **optional** one-off repair: normalizes demo emails, resets seed passwords to match `06_seed.sql`, ensures seed teacher is `approved`. Use if table-password login fails but rows exist.
17. `17_student_teacher_approval.sql` — apply student+teacher approval constraint/comment updates on existing DBs if they were created before this change.
18. `18_handle_new_auth_user.sql` — **after `11_api_grants.sql`**: trigger on `auth.users` inserts/updates `public.users` with the same `id`, `approval_status = pending`, and metadata-derived enrollment (student/teacher app registration only). Prevents “Auth user exists but no profile row” when the browser insert fails.
19. `19_attendance_time_out.sql` — **`attendance.time_out_at`** (optional student checkout after QR check-in) + `chk_attendance_time_out_after_scan`. In **`00_all_in_one.sql`** this is inlined **right after the 04 indexes** block. Re-run on existing DBs that predate the column.
20. `20_event_qr_random_unique.sql` — ensures `events.qr_code_data` is auto-generated (`EVT-<random>`), unique, and non-null on existing DBs.
21. `21_idx_users_academic_roster_comment.sql` — optional `COMMENT ON INDEX` for `idx_users_academic_roster` (already in fresh `04_indexes.sql` / `00_all_in_one.sql`); use on older DBs so the index documents Admin Users + roster default sort vs client-side expand/collapse and subgroup/name toggles.
22. `22_demo_events_import.sql` — **optional** paste: demo events + registrations + attendance only (requires `org-1`, `tea-1`, `stu-1` already in `public.users`). Use when the app shows “No events” but users exist — or re-run **`06_seed.sql`** instead.

**Merged:** `00_all_in_one.sql` inlines **01–04** (includes **19** after indexes), **07–09** (includes academic columns + `chk_users_academic_shape` and event QR uniqueness/defaults), **05** (RLS), **11** (grants), **18** (Auth → `public.users` trigger), **14** (student reminder RPCs), **16** (attendance enrollment view), **06** (seed), **10** (auth note + `select 1`), **12** (verify `select`), and ends with **13** as a **commented** repair block (uncomment or run `13_repair_demo_login_users.sql` separately — do not run `13` on top of a fresh seed in the same pass).

### Login / register troubleshooting

- **Seeded table-password accounts**: Rows must exist in **`public.users`** (emails such as `admin@gmail.com`, …) — run `06_seed.sql` (or `00_all_in_one.sql`) in the Supabase SQL Editor. Passwords are set only in the database (not shown in the app). The app checks this table **before** Supabase Auth.
- **Verify rows**: Run `12_verify_demo_users.sql` or `select id, email, role from public.users order by email;`. Expect `admin-1`, `org-1`, `tea-1`, `stu-1`. An empty table means the seed `INSERT` did not run.
- **Students see “No events posted yet”**: The app loads **`public.events`** from Supabase (no hard-coded list). Run **`06_seed.sql`** or **`22_demo_events_import.sql`** (after users exist) in the SQL Editor, or paste the seed block from **`00_all_in_one.sql`**. Then confirm: `select id, title, status from public.events order by id;` — expect `evt-1`…`evt-6`. **Supabase Auth-only accounts** (e.g. self-registered students) still see the same global event list once those rows exist.
- **Approval flow not working for students/teachers**: run `17_student_teacher_approval.sql` (or re-run `07_constraints.sql` / `00_all_in_one.sql`) so `approval_status` supports both roles.
- **"User already registered" but no status detail**: ensure `public.users` is readable (`11_api_grants.sql`, `05_rls.sql`) and run `12_verify_demo_users.sql`; register now checks existing DB row to show pending/rejected/approved-specific notice.
- **SIGNED_OUT vs demo login**: `signOut()` can emit `SIGNED_OUT` after table-password login. The app clears stored session on that event only when the user id looks like a Supabase Auth **UUID**; ids like `admin-1` are not cleared so demo login sticks.
- **Stale Auth on load**: If localStorage has a demo profile but the browser still has another Supabase session, the app signs out of Supabase on load and keeps the demo profile.
- **Table-password login still fails**: Run **`13_repair_demo_login_users.sql`** to fix email casing and reset the four seed passwords to match `06_seed.sql`, and ensure the seed teacher is `approved`. The app signs out of Supabase **only after** a successful table-password match (not at the start of the form), then applies your session so roles route correctly.
- **New registrations**: Under **Authentication → Providers → Email**, disable **Confirm email** for local testing, or confirm the inbox before signing in. Profile rows use **`public.users.id` = Auth user UUID**; `email` is stored lowercase.
- **“No profile row in public.users for this Auth account”**: Run **`18_handle_new_auth_user.sql`** in the SQL Editor (or use an updated **`00_all_in_one.sql`** from this repo). That installs the `auth.users` trigger so new sign-ups get a matching `public.users` row with **`approval_status = pending`**. Accounts that already exist only under **Authentication → Users** with no `public.users` row must be fixed manually (insert a row with `id` = that user’s UUID, or remove the Auth user and register again through the app).

## Migrations from an older schema

If you already created tables with anonymous `UNIQUE (event_id, user_id)` and need named constraints, drop the old unique constraint in the SQL editor (name shown in **Table Editor → Constraints**) before re-running `03_tables` sections, or `ALTER TABLE ... ADD CONSTRAINT` manually.

## Security note

`password` is stored as plain text to match the current demo app. For production, use Supabase Auth or hash passwords server-side and remove plaintext storage.
