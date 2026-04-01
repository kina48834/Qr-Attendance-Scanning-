-- =========================================================
-- Campus Connect - Supabase Full Setup (all-in-one)
-- =========================================================

create extension if not exists pgcrypto;

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
  qr_code_data text null,
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

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_start_date on public.events(start_date);
create index if not exists idx_events_organiser_id on public.events(organiser_id);
create index if not exists idx_attendance_event_id on public.attendance(event_id);
create index if not exists idx_attendance_user_id on public.attendance(user_id);
create index if not exists idx_attendance_scanned_at on public.attendance(scanned_at);
create index if not exists idx_event_registrations_event_id on public.event_registrations(event_id);
create index if not exists idx_event_registrations_user_id on public.event_registrations(user_id);

-- --- 07_constraints.sql (data fixes + app business rules) ---
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

update public.events
set end_date = start_date
where end_date < start_date;

update public.users
set approval_status = null
where role is distinct from 'teacher'::user_role
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

alter table public.events drop constraint if exists chk_events_end_after_start;
alter table public.events
  add constraint chk_events_end_after_start check (end_date >= start_date);

alter table public.users drop constraint if exists chk_users_approval_teacher_only;
alter table public.users
  add constraint chk_users_approval_teacher_only check (
    (role = 'teacher'::user_role) or (approval_status is null)
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

-- --- 08_triggers.sql ---
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

-- --- 09_comments.sql (ensure constraint names, then optional documentation) ---
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
  'Accounts for Login/Register, Admin User Management, teacher approval, organiser/teacher as event owners.';
comment on column public.users.id is 'Stable id used in session, URLs, QR payloads (ATTEND:userId:eventId).';
comment on column public.users.public_id is 'Random 6-digit profile/user ID shown in app header.';
comment on column public.users.email is 'Login identifier; unique.';
comment on column public.users.password is 'Plaintext in demo app; use hashing in production.';
comment on column public.users.role is 'administrator | organiser | student | teacher — routes and permissions.';
comment on column public.users.approval_status is 'Teacher only: pending (self-register), approved/rejected (admin).';
comment on column public.users.phone is 'Teacher profile; required when role = teacher.';
comment on column public.users.department is 'Teacher profile; required when role = teacher.';
comment on column public.users.employee_id is 'Teacher staff ID; required when role = teacher.';
comment on column public.users.office_location is 'Optional teacher office/room.';
comment on column public.users.avatar is 'Optional profile image URL (reserved for future UI).';
comment on table public.events is
  'Events browsed by students; created/edited by admin/organiser/teacher; QR via qr_code_data / EVT-{id}.';
comment on column public.events.organiser_id is 'FK to users; organiser or teacher (AdminEventForm).';
comment on column public.events.organiser_name is 'Denormalised display name for lists and search.';
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

insert into public.users (id, public_id, email, name, role, approval_status, phone, department, employee_id, created_at, password)
values
  ('admin-1', 910245, 'admin@gmail.com', 'Admin', 'administrator', null, null, null, null, now(), 'admin123'),
  ('org-1', 726184, 'organiser@gmail.com', 'Organiser', 'organiser', null, null, null, null, now(), 'organiser123'),
  ('tea-1', 583907, 'teacher@gmail.com', 'Teacher', 'teacher', 'approved', '555-0100', 'General', 'TCH-001', now(), 'teacher123'),
  ('stu-1', 442761, 'student@gmail.com', 'Student', 'student', null, null, null, null, now(), 'student123')
on conflict (id) do nothing;

insert into public.events
  (id, title, description, location, start_date, end_date, organiser_id, organiser_name, status, qr_code_data, max_attendees, created_at, updated_at)
values
  (
    'evt-1',
    'Welcome Week 2025',
    'Annual welcome event for new students.',
    'Main Hall',
    '2025-09-01T10:00:00Z',
    '2025-09-01T14:00:00Z',
    'org-1',
    'Organiser',
    'published',
    'EVT-evt-1',
    500,
    now(),
    now()
  ),
  (
    'evt-2',
    'Career fair spring 2026',
    'Meet employers and learn about internships and graduate roles.',
    'Library atrium',
    '2026-03-10T09:00:00Z',
    '2026-03-10T17:00:00Z',
    'org-1',
    'Organiser',
    'completed',
    'EVT-evt-2',
    200,
    now(),
    now()
  )
on conflict (id) do nothing;

-- --- 10_auth_public_users_alignment.sql (note) ---
-- Seed public.users ids (admin-1, …) differ from Supabase Auth UUIDs. The app tries table
-- password login before Auth so demo accounts work even if stray Auth users exist. Registered
-- users use Auth + public.users.id = auth user id. Optional: remove duplicate Auth users for
-- demo emails in Dashboard → Authentication → Users.
select 1 as auth_public_users_alignment_note;
