-- Business rules aligned with the React app (Register, Admin Users, Event forms, attendance)
-- Prerequisite: fix existing rows that would violate new checks (safe to re-run).

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

-- Academic enrollment (Register.tsx, profiles); mirrors src/constants/academicEnrollment.ts
alter table public.users add column if not exists academic_track text;
alter table public.users add column if not exists academic_year text;
alter table public.users add column if not exists academic_program text;

-- ---------------------------------------------------------------------------
-- Data fixes (run before ADD CONSTRAINT on live databases with legacy rows)
-- ---------------------------------------------------------------------------

-- Events: end before start → align end to start (satisfies end_date >= start_date)
update public.events
set end_date = start_date
where end_date < start_date;

-- Events: ensure qr_code_data exists and is unique (random EVT-* payloads).
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

-- Users: approval_status is used for student/teacher only (Admin clears it for admin/organiser)
update public.users
set approval_status = null
where role not in ('teacher'::user_role, 'student'::user_role)
  and approval_status is not null;

-- Users: teachers must have non-empty phone, department, employee_id (matches Register + AdminUsers)
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

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

-- Events: end must be on or after start
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

-- Users: only students/teachers use approval_status
alter table public.users drop constraint if exists chk_users_approval_teacher_only;
alter table public.users
  add constraint chk_users_approval_teacher_only check (
    (role in ('teacher'::user_role, 'student'::user_role)) or (approval_status is null)
  );

-- Users: teachers must have phone, department, employee_id
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
          and (academic_program is null or btrim(academic_program) = '')
        )
        or (
          academic_track = 'senior_high'
          and academic_year in ('11', '12')
          and (academic_program is null or btrim(academic_program) = '')
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
