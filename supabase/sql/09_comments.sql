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
comment on column public.users.email is 'Login identifier; unique.';
comment on column public.users.password is 'Plaintext in demo app; use hashing in production.';
comment on column public.users.role is 'administrator | organiser | student | teacher — routes and permissions.';
comment on column public.users.approval_status is 'Teacher only: pending (self-register), approved/rejected (admin).';
comment on column public.users.phone is 'Teacher profile; required when role = teacher.';
comment on column public.users.department is 'Summary line for lists/search; set from school enrollment for students/teachers (formatAcademicDepartmentLine) or legacy teacher text.';
comment on column public.users.academic_track is 'junior_high | senior_high | college — registration (Register.tsx). Rosters & Admin Users: JH (years 1–4), SH (11–12), college (years 1–4 + program).';
comment on column public.users.academic_year is 'JH 1–4 (UI: 1st–4th + First–Fourth year), SH 11–12 (Grade 11/12 only); college years use same 1st–4th labels; idx_users_academic_roster matches app ordering.';
comment on column public.users.academic_program is 'College program when track = college (app: BS Accountancy, BS CS, BS IT, …); otherwise null. Sub-sorts within college year on rosters.';
comment on column public.users.employee_id is 'Teacher staff ID; required when role = teacher.';
comment on column public.users.office_location is 'Optional teacher office/room.';
comment on column public.users.avatar is 'Optional profile image URL (reserved for future UI).';

comment on table public.events is
  'Events browsed by students. Inserts/updates: admin / organiser (app). Teachers view events and attendance rosters only — no edit/delete in app; teacher Events UI does not add new rows.';

comment on column public.events.organiser_id is 'FK to users; organiser or teacher (AdminEventForm).';
comment on column public.events.organiser_name is 'Denormalised display name for lists and search.';
comment on column public.events.start_date is 'Must be >= now() on insert; updates blocked from moving into the past while the event is not fully ended (trigger trg_events_validate_future_dates).';
comment on column public.events.end_date is 'Must be >= start_date (chk_events_end_after_start) and >= now() on insert; same update rule as start_date when the event has not fully ended.';
comment on column public.events.status is 'draft | published | completed | cancelled — gates student scan.';
comment on column public.events.qr_code_data is 'Event QR payload; StudentScan / eventMatchesScannedValue.';
comment on column public.events.max_attendees is 'Optional cap from event forms.';

comment on table public.attendance is
  'One row per student per event: StudentScan (venue QR) or OrganiserScanAttendance (ATTEND:userId:eventId).';

comment on column public.attendance.qr_code_data is 'Raw or normalised scanned string stored for audit.';

comment on constraint uq_attendance_event_user on public.attendance is
  'Prevents duplicate attendance for same user+event (matches StudentScan / OrganiserScan duplicate checks).';

comment on table public.event_registrations is
  'Student registers for an event (StudentEvents); analytics count registered vs attended.';

comment on constraint uq_event_registrations_event_user on public.event_registrations is
  'One registration per user per event; insertRegistration upserts on (event_id, user_id).';
