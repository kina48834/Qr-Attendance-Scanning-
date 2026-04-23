-- In-database documentation: maps columns to app features (see also supabase/sql/README.md)
--
-- Older DBs may have PostgreSQL default unique names (e.g. attendance_event_id_user_id_key)
-- instead of uq_attendance_event_user. Normalize names before COMMENT ON CONSTRAINT.

do $$
declare
  old_name text;
begin
  if to_regclass('public.attendance') is null then
    return;
  end if;
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance'::regclass
      and conname = 'uq_attendance_event_user'
  ) then
    return;
  end if;
  select c.conname into old_name
  from pg_constraint c
  where c.conrelid = 'public.attendance'::regclass
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) ilike '%event_id%'
    and pg_get_constraintdef(c.oid) ilike '%user_id%'
  order by c.conname
  limit 1;
  if old_name is not null then
    execute format(
      'alter table public.attendance rename constraint %I to uq_attendance_event_user',
      old_name
    );
  else
    alter table public.attendance
      add constraint uq_attendance_event_user unique (event_id, user_id);
  end if;
end $$;

do $$
declare
  old_name text;
begin
  if to_regclass('public.event_registrations') is null then
    return;
  end if;
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.event_registrations'::regclass
      and conname = 'uq_event_registrations_event_user'
  ) then
    return;
  end if;
  select c.conname into old_name
  from pg_constraint c
  where c.conrelid = 'public.event_registrations'::regclass
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) ilike '%event_id%'
    and pg_get_constraintdef(c.oid) ilike '%user_id%'
  order by c.conname
  limit 1;
  if old_name is not null then
    execute format(
      'alter table public.event_registrations rename constraint %I to uq_event_registrations_event_user',
      old_name
    );
  else
    alter table public.event_registrations
      add constraint uq_event_registrations_event_user unique (event_id, user_id);
  end if;
end $$;

comment on table public.users is
  'Accounts for Login/Register. CRUD and teacher approval are done in the administrator User Management UI only — the teacher role has no user management screen. Organisers/teachers own events.';

comment on column public.users.id is 'Stable id used in session, URLs, QR payloads (ATTEND:userId:eventId).';
comment on column public.users.public_id is 'Random 6-digit profile/user ID shown in app header.';
comment on column public.users.email is 'Login identifier; unique. Register shows role-aware notice when email already exists (approved/pending/rejected).';
comment on column public.users.password is 'Plaintext in demo app; use hashing in production.';
comment on column public.users.role is 'administrator | organiser | student | teacher — routes and permissions.';
comment on column public.users.approval_status is 'Student/teacher approval: pending on self-register, approved/rejected by admin in User management; null for administrator/organiser.';
comment on column public.users.phone is 'Teacher profile; required when role = teacher.';
comment on column public.users.department is 'Summary line for lists/search; set from Department (Register/Admin) for students/teachers (formatAcademicDepartmentLine) or legacy teacher text.';
comment on column public.users.academic_track is 'junior_high | senior_high | college — Register.tsx / AdminUsers.tsx: interactive Track buttons, grade/year buttons, and section/strand/program buttons. Rosters: JH (years 1–4 stored, UI Grade 7–10), SH (11–12), college (years 1–4 + program).';
comment on column public.users.academic_year is 'JH: stored 1–4 maps to UI Grade 7–10; SH: 11–12 (Grade 11/12); college: 1–4 with 1st/2nd/3rd/4th labels in app; idx_users_academic_roster matches app ordering.';
comment on column public.users.academic_program is 'Track-specific subgroup selected in registration/admin Department UI via button selectors: JH section list by grade, SH strand/track list (BE/ASSH/STEM/TECHPRO), or college program (COLLEGE_PROGRAMS). Used in subgrouping and roster sort/display.';
comment on column public.users.employee_id is 'Teacher staff ID; required when role = teacher.';
comment on column public.users.office_location is 'Optional teacher office/room.';
comment on column public.users.avatar is 'Optional profile image (URL or data URL) shown in profile pages, scanner result cards, and Admin user management.';

comment on table public.events is
  'Events browsed by students. Inserts/updates: admin / organiser (app). Teachers view events and attendance rosters only — no edit/delete in app; teacher Events UI does not add new rows.';

comment on column public.events.organiser_id is 'FK to users; organiser or teacher (AdminEventForm).';
comment on column public.events.organiser_name is 'Denormalised display name for lists and search.';
comment on column public.events.start_date is 'Insert: must be >= now() for draft/cancelled and for published rows that already ended; completed rows may be historical; published rows with end_date >= now() may have start in the past (in progress). Updates: blocked from moving into the past while not fully ended (trg_events_validate_future_dates).';
comment on column public.events.end_date is 'Must be >= start_date (chk_events_end_after_start) and >= now() on insert; same update rule as start_date when the event has not fully ended.';
comment on column public.events.status is 'draft | published | completed | cancelled — gates organiser scanning of student ATTEND QR and student My QR visibility.';
comment on column public.events.qr_code_data is
  'Legacy auto-generated EVT-<random> payload kept unique for the row; primary attendance flow uses student personal QR ATTEND:userId:eventId (not shown in app UI).';
comment on column public.events.max_attendees is 'Optional cap from event forms.';
comment on constraint uq_events_qr_code_data on public.events is
  'Guarantees every event QR payload is unique.';

comment on table public.attendance is
  'One row per student per event: organiser (or event owner) scans student personal QR `ATTEND:userId:eventId`. `scanned_at` = first scan (time in); `time_out_at` = second scan of the same QR (time out). Rosters join `users` for grouping; exports include Department + Grade level + Section/Strand columns.';

comment on column public.attendance.scanned_at is 'QR check-in (time in).';

comment on column public.attendance.time_out_at is
  'Second organiser scan of the same student event QR (time out); null until then. Must be >= scanned_at (`chk_attendance_time_out_after_scan`).';

comment on column public.attendance.qr_code_data is 'Raw or normalised scanned string stored for audit.';

comment on constraint uq_attendance_event_user on public.attendance is
  'Prevents duplicate attendance rows for same user+event; checkout updates the same row (`time_out_at`).';

comment on table public.event_registrations is
  'Student registers for an event (StudentEvents); analytics count registered vs attended.';

comment on constraint uq_event_registrations_event_user on public.event_registrations is
  'One registration per user per event; insertRegistration upserts on (event_id, user_id).';
