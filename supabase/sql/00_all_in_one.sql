-- =========================================================
-- Campus Connect - Supabase Full Setup (all-in-one)
-- =========================================================
-- Mirrors the numbered scripts in this folder. When you change any of:
--   01_extensions.sql  02_types.sql  03_tables.sql  04_indexes.sql
--   05_rls.sql  06_seed.sql  07_constraints.sql  08_triggers.sql
--   09_comments.sql  10_auth_public_users_alignment.sql  11_api_grants.sql
--   14_student_event_reminder_functions.sql
--   15_academic_enrollment_columns.sql (also inlined in 07_constraints.sql)
--   16_attendance_enrollment_view.sql
--   18_handle_new_auth_user.sql
--   19_attendance_time_out.sql (inlined after 04 indexes)
--   12_verify_demo_users.sql  13_repair_demo_login_users.sql
-- update this file to match (or re-paste sections).
--
-- Order in this file: 01 → 02 → 03 → 04 (+19 attendance time_out) → 07 → 08 → 09 → 05 → 11 → 18 → 14 → 16 → 06 → 10 → 12.
-- Script 13 is appended only as a commented block (run separately to repair existing DBs).

-- --- 01_extensions.sql ---
create extension if not exists pgcrypto;

-- --- 02_types.sql ---

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('administrator', 'organiser', 'student', 'teacher');
  end if;
  if not exists (select 1 from pg_type where typname = 'teacher_approval_status') then
    create type teacher_approval_status as enum ('approved', 'pending', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('draft', 'published', 'completed', 'cancelled');
  end if;
end $$;

-- --- 03_tables.sql ---
-- Core tables — columns mirror src/types/index.ts and src/supabase/dataService.ts

create table if not exists public.users (
  id text primary key,
  public_id bigint unique,
  email text not null unique,
  name text not null,
  role user_role not null,
  avatar text null,
  approval_status teacher_approval_status null,
  phone text null,
  department text null,
  employee_id text null,
  office_location text null,
  academic_track text null,
  academic_year text null,
  academic_program text null,
  created_at timestamptz not null default now(),
  password text not null
);

create or replace function public.generate_public_user_id()
returns bigint
language plpgsql
as $$
declare
  candidate bigint;
begin
  loop
    candidate := floor(random() * 900000 + 100000)::bigint;
    exit when not exists (select 1 from public.users where public_id = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.users alter column public_id set default public.generate_public_user_id();
update public.users
set public_id = public.generate_public_user_id()
where public_id is null;
alter table public.users alter column public_id set not null;

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text null default '',
  location text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  organiser_id text not null references public.users(id) on delete cascade,
  organiser_name text not null,
  status event_status not null default 'draft',
  qr_code_data text not null default ('EVT-' || upper(encode(gen_random_bytes(12), 'hex'))),
  constraint uq_events_qr_code_data unique (qr_code_data),
  max_attendees integer null check (max_attendees is null or max_attendees > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  scanned_at timestamptz not null default now(),
  time_out_at timestamptz null,
  qr_code_data text not null,
  constraint uq_attendance_event_user unique (event_id, user_id)
);

create table if not exists public.event_registrations (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  constraint uq_event_registrations_event_user unique (event_id, user_id)
);

-- --- 04_indexes.sql ---
-- Performance indexes (same as 04_indexes.sql)

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
-- Roster / admin list ordering: junior_high (years 1–4 stored, UI Grade 7–10) → senior_high → college (year + program); mirrors app academicEnrollmentOrdering.ts
create index if not exists idx_users_academic_roster on public.users(academic_track, academic_year, academic_program);
comment on index public.idx_users_academic_roster is
  'Default ordering for Admin → Users and attendance rosters (teacher / organiser / admin event roster) by academic_track, academic_year, academic_program. The app may expand/collapse tracks and department subgroups client-side; subgroup / name sort toggles are client-side; exports keep canonical ordering.';
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_start_date on public.events(start_date);
create index if not exists idx_events_organiser_id on public.events(organiser_id);
create index if not exists idx_attendance_event_id on public.attendance(event_id);
create index if not exists idx_attendance_user_id on public.attendance(user_id);
create index if not exists idx_attendance_scanned_at on public.attendance(scanned_at);
create index if not exists idx_event_registrations_event_id on public.event_registrations(event_id);

-- --- 19_attendance_time_out.sql ---
alter table public.attendance add column if not exists time_out_at timestamptz null;

alter table public.attendance drop constraint if exists chk_attendance_time_out_after_scan;
alter table public.attendance
  add constraint chk_attendance_time_out_after_scan check (
    time_out_at is null or time_out_at >= scanned_at
  );

comment on column public.attendance.time_out_at is
  'When the organiser scanned the student’s personal event QR the second time (time out); null until then. Must be on or after scanned_at.';
create index if not exists idx_event_registrations_user_id on public.event_registrations(user_id);

-- --- 07_constraints.sql ---
-- Business rules aligned with the React app; prerequisite data fixes (safe to re-run).

create or replace function public.generate_public_user_id()
returns bigint
language plpgsql
as $$
declare
  candidate bigint;
begin
  loop
    candidate := floor(random() * 900000 + 100000)::bigint;
    exit when not exists (select 1 from public.users where public_id = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.users add column if not exists public_id bigint;
update public.users
set public_id = public.generate_public_user_id()
where public_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'uq_users_public_id'
  ) then
    alter table public.users add constraint uq_users_public_id unique (public_id);
  end if;
end $$;

alter table public.users alter column public_id set not null;
alter table public.users alter column public_id set default public.generate_public_user_id();

alter table public.users add column if not exists academic_track text;
alter table public.users add column if not exists academic_year text;
alter table public.users add column if not exists academic_program text;

-- Data fixes (before ADD CONSTRAINT on live DBs with legacy rows)
update public.events
set end_date = start_date
where end_date < start_date;

update public.events
set qr_code_data = 'EVT-' || upper(encode(gen_random_bytes(12), 'hex'))
where qr_code_data is null
  or btrim(qr_code_data) = '';

with ranked as (
  select id, row_number() over (partition by qr_code_data order by created_at, id) as rn
  from public.events
)
update public.events e
set qr_code_data = 'EVT-' || upper(encode(gen_random_bytes(12), 'hex'))
from ranked r
where e.id = r.id
  and r.rn > 1;

update public.users
set approval_status = null
where role not in ('teacher'::user_role, 'student'::user_role)
  and approval_status is not null;

update public.users
set
  phone = coalesce(nullif(btrim(phone), ''), 'Not set'),
  department = coalesce(nullif(btrim(department), ''), 'General'),
  employee_id = coalesce(nullif(btrim(employee_id), ''), 'TBD-' || left(id, 24))
where role = 'teacher'::user_role
  and (
    phone is null
    or btrim(phone) = ''
    or department is null
    or btrim(department) = ''
    or employee_id is null
    or btrim(employee_id) = ''
  );

-- Constraints
alter table public.events drop constraint if exists chk_events_end_after_start;
alter table public.events
  add constraint chk_events_end_after_start check (end_date >= start_date);

alter table public.events
  alter column qr_code_data set default ('EVT-' || upper(encode(gen_random_bytes(12), 'hex')));
alter table public.events
  alter column qr_code_data set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'uq_events_qr_code_data'
  ) then
    alter table public.events add constraint uq_events_qr_code_data unique (qr_code_data);
  end if;
end $$;

alter table public.users drop constraint if exists chk_users_approval_teacher_only;
alter table public.users
  add constraint chk_users_approval_teacher_only check (
    (role in ('teacher'::user_role, 'student'::user_role)) or (approval_status is null)
  );

alter table public.users drop constraint if exists chk_users_teacher_staff_fields;
alter table public.users
  add constraint chk_users_teacher_staff_fields check (
    (role <> 'teacher'::user_role)
    or (
      phone is not null
      and btrim(phone) <> ''
      and department is not null
      and btrim(department) <> ''
      and employee_id is not null
      and btrim(employee_id) <> ''
    )
  );

alter table public.users drop constraint if exists chk_users_academic_shape;
alter table public.users
  add constraint chk_users_academic_shape check (
    academic_track is null
    or (
      academic_track in ('junior_high', 'senior_high', 'college')
      and (
        (
          academic_track = 'junior_high'
          and academic_year in ('1', '2', '3', '4')
          and (
            academic_program is null
            or btrim(academic_program) = ''
            or (
              academic_year = '1'
              and btrim(academic_program) in ('Skinner', 'Dewey', 'Freud', 'Locke', 'Pigget', 'Rousseau', 'Thorndike')
            )
            or (
              academic_year = '2'
              and btrim(academic_program) in (
                'Socrates',
                'Mencius',
                'Archimedes',
                'Aristotle',
                'Confucius',
                'Emerson',
                'Plato'
              )
            )
            or (
              academic_year = '3'
              and btrim(academic_program) in (
                'Rembrandt',
                'Braque',
                'Da Vinci',
                'Froebel',
                'Picasso',
                'Van Gogh',
                'Vermeer'
              )
            )
            or (
              academic_year = '4'
              and btrim(academic_program) in (
                'Vygotsky',
                'Ausubel',
                'Bruner',
                'Descartes',
                'Gardner',
                'Kohlberg',
                'Voltaire'
              )
            )
          )
        )
        or (
          academic_track = 'senior_high'
          and academic_year in ('11', '12')
          and (
            academic_program is null
            or btrim(academic_program) = ''
            or btrim(academic_program) in (
              'Business Entrepreneurship (BE)',
              'Arts, Social Sciences & Humanities (ASSH)',
              'Science, Technology, Engineering & Mathematics (STEM)',
              'Technical Professional (TECHPRO)'
            )
          )
        )
        or (
          academic_track = 'college'
          and academic_year in ('1', '2', '3', '4')
          and academic_program is not null
          and btrim(academic_program) <> ''
        )
      )
    )
  );

-- --- 08_triggers.sql ---
-- Reject past start/end on events (forms + API). Fully ended rows skip update checks.

create or replace function public.events_validate_start_end_not_in_past()
returns trigger
language plpgsql
as $f$
begin
  if tg_op = 'INSERT' then
    if new.status = 'completed'::event_status then
      return new;
    end if;
    if new.status = 'published'::event_status and new.end_date >= now() then
      return new;
    end if;
    if new.start_date < now() then
      raise exception 'events.start_date cannot be in the past';
    end if;
    if new.end_date < now() then
      raise exception 'events.end_date cannot be in the past';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.end_date >= now() then
      if new.start_date is distinct from old.start_date and new.start_date < now() then
        raise exception 'events.start_date cannot be moved to the past';
      end if;
      if new.end_date is distinct from old.end_date and new.end_date < now() then
        raise exception 'events.end_date cannot be moved to the past';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$f$;

drop trigger if exists trg_events_validate_future_dates on public.events;
create trigger trg_events_validate_future_dates
  before insert or update on public.events
  for each row
  execute function public.events_validate_start_end_not_in_past();

-- Keep events.updated_at in sync on every row update.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_events_set_updated_at on public.events;
create trigger trg_events_set_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

-- --- 09_comments.sql ---
-- In-database documentation (see also supabase/sql/README.md).
-- Older DBs may have default unique constraint names; normalize before COMMENT ON CONSTRAINT.

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
comment on column public.users.department is 'Summary line for lists/search; from Department (Register/Admin) or legacy teacher text.';
comment on column public.users.academic_track is 'junior_high | senior_high | college — Register.tsx / AdminUsers.tsx: interactive Track buttons, grade/year buttons, and section/strand/program buttons. Rosters: JH (years 1–4 stored, UI Grade 7–10), SH (11–12), college (years 1–4 + program).';
comment on column public.users.academic_year is 'JH: stored 1–4 maps to UI Grade 7–10; SH: 11–12 (Grade 11/12); college: 1–4 with 1st–Fourth year labels in app; idx_users_academic_roster matches app ordering.';
comment on column public.users.academic_program is 'Track-specific subgroup selected in registration/admin Department UI via button selectors: JH section list by grade, SH strand/track list (BE/ASSH/STEM/TECHPRO), or college program (COLLEGE_PROGRAMS). Used in subgrouping and roster sort/display.';
comment on column public.users.employee_id is 'Teacher staff ID; required when role = teacher.';
comment on column public.users.office_location is 'Optional teacher office/room.';
comment on column public.users.avatar is 'Optional profile image URL (reserved for future UI).';
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
  'One row per student per event: organiser (or event owner) scans student personal QR `ATTEND:userId:eventId`. `scanned_at` = first scan (time in); `time_out_at` = second scan (time out). Rosters join `users` for grouping; exports include Department + Grade level + Section/Strand columns.';
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

-- --- 05_rls.sql ---
-- Row Level Security (open policies for client-side app)

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "users_all_access" on public.users;
create policy "users_all_access" on public.users for all using (true) with check (true);
drop policy if exists "events_all_access" on public.events;
create policy "events_all_access" on public.events for all using (true) with check (true);
drop policy if exists "attendance_all_access" on public.attendance;
create policy "attendance_all_access" on public.attendance for all using (true) with check (true);
drop policy if exists "registrations_all_access" on public.event_registrations;
create policy "registrations_all_access" on public.event_registrations for all using (true) with check (true);

-- --- 11_api_grants.sql ---
-- PostgREST: anon + authenticated must reach public tables for the browser app.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.users to anon, authenticated;
grant select, insert, update, delete on table public.events to anon, authenticated;
grant select, insert, update, delete on table public.attendance to anon, authenticated;
grant select, insert, update, delete on table public.event_registrations to anon, authenticated;

-- --- 18_handle_new_auth_user.sql ---
-- Sync Supabase Auth sign-ups to public.users (same id as auth.users.id).
-- Fixes: Auth user exists but no profile row → login / Admin approval list breaks.
-- Runs as SECURITY DEFINER so RLS does not block the insert.
-- Only provisions rows when raw_user_meta_data.role is student or teacher (app registration).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_role user_role;
  v_email text;
  v_name text;
  v_track text;
  v_year text;
  v_program text;
  v_phone text;
  v_emp text;
  v_office text;
  v_dept text;
  yr_label text;
  shape_ok boolean;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  if lower(coalesce(meta->>'role', '')) not in ('student', 'teacher') then
    return new;
  end if;

  begin
    v_role := (meta->>'role')::user_role;
  exception
    when others then
      return new;
  end;

  if v_role not in ('student'::user_role, 'teacher'::user_role) then
    return new;
  end if;

  v_email := lower(btrim(coalesce(new.email, '')));
  if v_email = '' then
    return new;
  end if;

  v_name := nullif(btrim(coalesce(meta->>'name', '')), '');
  if v_name is null then
    v_name := split_part(v_email, '@', 1);
  end if;

  v_track := nullif(btrim(meta->>'academic_track'), '');
  v_year := nullif(btrim(meta->>'academic_year'), '');
  v_program := nullif(btrim(meta->>'academic_program'), '');
  v_phone := nullif(btrim(meta->>'phone'), '');
  v_emp := nullif(btrim(meta->>'employee_id'), '');
  v_office := nullif(btrim(meta->>'office_location'), '');

  v_dept := null;
  shape_ok := true;
  if v_track is not null and v_year is not null then
    shape_ok :=
      (
        v_track = 'junior_high'
        and v_year in ('1', '2', '3', '4')
        and (
          (v_year = '1' and v_program in ('Skinner', 'Dewey', 'Freud', 'Locke', 'Pigget', 'Rousseau', 'Thorndike'))
          or (
            v_year = '2'
            and v_program in ('Socrates', 'Mencius', 'Archimedes', 'Aristotle', 'Confucius', 'Emerson', 'Plato')
          )
          or (
            v_year = '3'
            and v_program in ('Rembrandt', 'Braque', 'Da Vinci', 'Froebel', 'Picasso', 'Van Gogh', 'Vermeer')
          )
          or (
            v_year = '4'
            and v_program in ('Vygotsky', 'Ausubel', 'Bruner', 'Descartes', 'Gardner', 'Kohlberg', 'Voltaire')
          )
        )
      )
      or (
        v_track = 'senior_high'
        and v_year in ('11', '12')
        and v_program in (
          'Business Entrepreneurship (BE)',
          'Arts, Social Sciences & Humanities (ASSH)',
          'Science, Technology, Engineering & Mathematics (STEM)',
          'Technical Professional (TECHPRO)'
        )
      )
      or (
        v_track = 'college'
        and v_year in ('1', '2', '3', '4')
        and v_program is not null
        and btrim(v_program) <> ''
      );
    if shape_ok then
      if v_track = 'junior_high' then
        v_dept :=
          'Junior high — '
          || case v_year
            when '1' then 'Grade 7'
            when '2' then 'Grade 8'
            when '3' then 'Grade 9'
            when '4' then 'Grade 10'
          end
          || ' — '
          || coalesce(v_program, 'Section not set');
      elsif v_track = 'senior_high' then
        v_dept :=
          'Senior high — '
          || case v_year
            when '11' then 'Grade 11'
            when '12' then 'Grade 12'
          end
          || ' — '
          || coalesce(v_program, 'Strand not set');
      else
        yr_label :=
          case v_year
            when '1' then '1st — First year'
            when '2' then '2nd — Second year'
            when '3' then '3rd — Third year'
            when '4' then '4th — Fourth year'
          end;
        v_dept := 'College — ' || v_program || ' — ' || yr_label;
      end if;
    else
      v_track := null;
      v_year := null;
      v_program := null;
      v_dept := null;
    end if;
  end if;

  if v_role = 'teacher'::user_role then
    v_phone := coalesce(v_phone, 'Not set');
    v_dept := coalesce(v_dept, 'General');
    v_emp := coalesce(v_emp, 'TBD-' || left(replace(new.id::text, '-', ''), 24));
  end if;

  begin
    insert into public.users (
      id,
      email,
      name,
      role,
      password,
      approval_status,
      phone,
      department,
      employee_id,
      office_location,
      academic_track,
      academic_year,
      academic_program,
      created_at
    )
    values (
      new.id,
      v_email,
      v_name,
      v_role,
      'supabase-auth',
      'pending'::teacher_approval_status,
      case when v_role = 'teacher'::user_role then v_phone else null end,
      v_dept,
      case when v_role = 'teacher'::user_role then v_emp else null end,
      v_office,
      v_track,
      v_year,
      v_program,
      coalesce(new.created_at, now())
    )
    on conflict (id) do update
    set
      email = excluded.email,
      name = excluded.name,
      role = excluded.role,
      password = excluded.password,
      approval_status = excluded.approval_status,
      phone = excluded.phone,
      department = excluded.department,
      employee_id = excluded.employee_id,
      office_location = excluded.office_location,
      academic_track = excluded.academic_track,
      academic_year = excluded.academic_year,
      academic_program = excluded.academic_program;
  exception
    when unique_violation then
      -- e.g. email already owned by another profile id; do not fail Auth signup
      null;
  end;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'After insert on auth.users: creates public.users row (pending) for student/teacher self-registration metadata; id matches auth.users.id.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- --- 14_student_event_reminder_functions.sql ---
-- Optional RPC mirror of student Reminders page (see src/utils/studentEventReminders.ts).

create or replace function public.student_events_open_no_attendance(p_user_id text)
returns setof public.events
language sql
stable
as $$
  select e.*
  from public.events e
  where e.status = 'published'
    and e.end_date >= now()
    and not exists (
      select 1 from public.attendance a
      where a.event_id = e.id and a.user_id = p_user_id
    )
  order by e.start_date asc;
$$;

create or replace function public.student_events_missed_no_attendance(p_user_id text)
returns setof public.events
language sql
stable
as $$
  select e.*
  from public.events e
  where e.status in ('published', 'completed')
    and e.end_date < now()
    and not exists (
      select 1 from public.attendance a
      where a.event_id = e.id and a.user_id = p_user_id
    )
  order by e.end_date desc;
$$;

grant execute on function public.student_events_open_no_attendance(text) to anon, authenticated;
grant execute on function public.student_events_missed_no_attendance(text) to anon, authenticated;

create or replace function public.student_reminders_count(p_user_id text)
returns integer
language sql
stable
as $$
  select coalesce(
    (select count(*)::int
     from public.events e
     where e.status = 'published'
       and e.end_date >= now()
       and not exists (
         select 1 from public.attendance a
         where a.event_id = e.id and a.user_id = p_user_id
       )),
    0
  )
  + coalesce(
    (select count(*)::int
     from public.events e
     where e.status in ('published', 'completed')
       and e.end_date < now()
       and not exists (
         select 1 from public.attendance a
         where a.event_id = e.id and a.user_id = p_user_id
       )),
    0
  );
$$;

grant execute on function public.student_reminders_count(text) to anon, authenticated;

-- --- 16_attendance_enrollment_view.sql ---
-- Reporting helper: attendance joined to users.academic_* (roster grouping in app).
-- App PDF/Excel exports: "Department" = department only (junior high / senior high / college program, no year), "Grade level" = academic_track/year label; no email in export; name from users.name.

drop view if exists public.v_attendance_with_user_enrollment;

create view public.v_attendance_with_user_enrollment as
select
  a.id as attendance_id,
  a.event_id,
  a.user_id,
  a.user_name,
  a.user_email,
  a.scanned_at,
  a.time_out_at,
  a.qr_code_data,
  u.academic_track,
  u.academic_year,
  u.academic_program,
  u.department
from public.attendance a
left join public.users u on u.id = a.user_id;

comment on view public.v_attendance_with_user_enrollment is
  'LEFT JOIN attendance to users for roster grouping: JH (1–4 stored, UI Grade 7–10), SH (11–12), college (years 1–4 + program); per-level numbering in app (buildAttendanceTrackSections).';

grant select on public.v_attendance_with_user_enrollment to anon, authenticated;

-- --- 06_seed.sql ---
-- Seed data (teacher row must satisfy chk_users_teacher_staff_fields).
-- Demo user ids (admin-1, …) are not Supabase Auth UUIDs; table-password login first (see 10).

insert into public.users (
  id,
  public_id,
  email,
  name,
  role,
  approval_status,
  phone,
  department,
  employee_id,
  academic_track,
  academic_year,
  academic_program,
  created_at,
  password
)
values
  ('admin-1', 910245, 'admin@gmail.com', 'Admin', 'administrator', null, null, null, null, null, null, null, now(), 'admin1919'),
  ('org-1', 726184, 'organiser@gmail.com', 'Organiser', 'organiser', null, null, null, null, null, null, null, now(), 'organiser1919'),
  ('tea-1', 583907, 'teacher@gmail.com', 'Teacher', 'teacher', 'approved', '555-0100', 'General', 'TCH-001', null, null, null, now(), 'teacher1919'),
  (
    'stu-1',
    442761,
    'student@gmail.com',
    'Student',
    'student',
    'approved',
    null,
    'College — BS Information Technology — 1st — First year',
    null,
    'college',
    '1',
    'BS Information Technology',
    now(),
    'student1919'
  )
on conflict (id) do update set
  public_id = excluded.public_id,
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  approval_status = excluded.approval_status,
  phone = excluded.phone,
  department = excluded.department,
  employee_id = excluded.employee_id,
  academic_track = excluded.academic_track,
  academic_year = excluded.academic_year,
  academic_program = excluded.academic_program,
  password = excluded.password;

-- Demo events (evt-1..evt-6): published, draft, completed, teacher-owned — visible to students via fetchEvents()
delete from public.attendance where event_id in ('evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6');
delete from public.event_registrations where event_id in ('evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6');
delete from public.events where id in ('evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6');

begin;
alter table public.events disable trigger trg_events_validate_future_dates;

insert into public.events (
  id,
  title,
  description,
  location,
  start_date,
  end_date,
  organiser_id,
  organiser_name,
  status,
  qr_code_data,
  max_attendees,
  created_at,
  updated_at
)
values
  (
    'evt-1',
    'Welcome to Campus Connect',
    'Orientation-style welcome: students use My event QR; organisers scan for time in and again for time out. Admins and teachers can open the roster for this event.',
    'Main Hall',
    date_trunc('minute', now() + interval '2 hours'),
    date_trunc('minute', now() + interval '6 hours'),
    'org-1',
    'Organiser',
    'published',
    'EVT-DEMOWELCOMECAMPUSCONNECT01',
    500,
    now(),
    now()
  ),
  (
    'evt-2',
    'Club Fair — Spring',
    'Meet student clubs and sign up. Published and already underway so lists show a mix of upcoming and in-progress events.',
    'Student Plaza',
    date_trunc('minute', now() - interval '2 hours'),
    date_trunc('minute', now() + interval '5 hours'),
    'org-1',
    'Organiser',
    'published',
    'EVT-DEMOCLUBFAIRSPRING202602AA',
    200,
    now(),
    now()
  ),
  (
    'evt-3',
    'Science Week Kickoff (draft)',
    'Draft event — visible to admins and organiser; students see it as not started until published.',
    'Science Building Lobby',
    date_trunc('minute', now() + interval '14 days'),
    date_trunc('minute', now() + interval '14 days' + interval '3 hours'),
    'org-1',
    'Organiser',
    'draft',
    'EVT-DEMOSCIWEEKDRAFTPLACE2026BB',
    120,
    now(),
    now()
  ),
  (
    'evt-4',
    'Sports Day',
    'Inter-college sports. Published; starts in a few days.',
    'Athletics Field',
    date_trunc('minute', now() + interval '10 days'),
    date_trunc('minute', now() + interval '10 days' + interval '8 hours'),
    'org-1',
    'Organiser',
    'published',
    'EVT-DEMOSPORTSDAYFIELD202602CC',
    800,
    now(),
    now()
  ),
  (
    'evt-5',
    'Alumni Networking (completed)',
    'Past event for testing completed status and history views.',
    'Alumni Hall',
    date_trunc('minute', now() - interval '20 days'),
    date_trunc('minute', now() - interval '20 days' + interval '3 hours'),
    'org-1',
    'Organiser',
    'completed',
    'EVT-DEMOALUMNIMEETPAST202601DD',
    150,
    now(),
    now()
  ),
  (
    'evt-6',
    'Teacher-led study skills workshop',
    'Owned by the demo teacher account so teachers see an event they organise.',
    'Room 204',
    date_trunc('minute', now() + interval '5 days'),
    date_trunc('minute', now() + interval '5 days' + interval '2 hours'),
    'tea-1',
    'Teacher',
    'published',
    'EVT-DEMOTEACHERWORKSHOP2026EE',
    40,
    now(),
    now()
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  organiser_id = excluded.organiser_id,
  organiser_name = excluded.organiser_name,
  status = excluded.status,
  qr_code_data = excluded.qr_code_data,
  max_attendees = excluded.max_attendees,
  updated_at = now();

alter table public.events enable trigger trg_events_validate_future_dates;
commit;

insert into public.event_registrations (id, event_id, user_id, registered_at)
values
  ('reg-seed-1', 'evt-2', 'stu-1', now()),
  ('reg-seed-2', 'evt-4', 'stu-1', now())
on conflict (event_id, user_id) do nothing;

insert into public.attendance (id, event_id, user_id, user_name, user_email, scanned_at, time_out_at, qr_code_data)
values (
  'att-seed-1',
  'evt-1',
  'stu-1',
  'Student',
  'student@gmail.com',
  now() - interval '15 minutes',
  null,
  'ATTEND:stu-1:evt-1'
)
on conflict (event_id, user_id) do update set
  user_name = excluded.user_name,
  user_email = excluded.user_email,
  scanned_at = excluded.scanned_at,
  qr_code_data = excluded.qr_code_data;

insert into public.attendance (id, event_id, user_id, user_name, user_email, scanned_at, time_out_at, qr_code_data)
values (
  'att-seed-2',
  'evt-2',
  'stu-1',
  'Student',
  'student@gmail.com',
  now() - interval '1 hour',
  null,
  'ATTEND:stu-1:evt-2'
)
on conflict (event_id, user_id) do nothing;

-- --- 10_auth_public_users_alignment.sql ---
-- Auth vs public.users (demo / production alignment)
-- Seed rows in public.users use fixed ids (e.g. admin-1) and plain passwords in `password`.
-- Supabase Authentication users have a UUID `id` in auth.users; your app profile row must use
-- the SAME id in public.users for the Auth sign-in path (see Register flow).
--
-- If you create Authentication users for the same emails as seed accounts (admin@gmail.com, …)
-- without a matching public.users row (same UUID), sign-in can fail with "no profile".
-- The app tries the table password first for seed accounts, then Supabase Auth.
--
-- Login calls auth.signOut() only after a successful table-password match so a stale Auth session
-- does not overwrite that session on the next auth state sync (see app AuthContext).
--
-- Run 11_api_grants.sql (or this all-in-one) if SELECT on public.users fails from the browser.
--
-- Optional cleanup (Dashboard is easiest): Authentication → Users → delete duplicate users for
-- demo emails if you only want table-password login for those accounts.
--
-- No DDL below — safe to run as-is.

select 1 as auth_public_users_alignment_note;

-- --- 12_verify_demo_users.sql ---
-- Confirm seeded rows exist (login reads public.users before Supabase Auth).

select id, email, role, left(password, 3) || '…' as password_preview
from public.users
order by email;

-- --- 13_repair_demo_login_users.sql (DO NOT run on a fresh paste of this script) ---
-- Copy/run separately when an existing project has wrong email casing or old seed passwords.
-- Uncomment the block below only for that repair, or execute 13_repair_demo_login_users.sql alone.
--
-- update public.users
-- set
--   email = lower(btrim(email)),
--   password = case id
--     when 'admin-1' then 'admin1919'
--     when 'org-1' then 'organiser1919'
--     when 'tea-1' then 'teacher1919'
--     when 'stu-1' then 'student1919'
--     else password
--   end,
--   approval_status = case id
--     when 'tea-1' then 'approved'::teacher_approval_status
--     else approval_status
--   end
-- where id in ('admin-1', 'org-1', 'tea-1', 'stu-1');
--
-- select id, email, role, approval_status, left(password, 3) || '…' as pwd_preview
-- from public.users
-- where id in ('admin-1', 'org-1', 'tea-1', 'stu-1')
-- order by email;
