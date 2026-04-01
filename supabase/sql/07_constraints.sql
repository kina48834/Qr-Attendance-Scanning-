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

-- ---------------------------------------------------------------------------
-- Data fixes (run before ADD CONSTRAINT on live databases with legacy rows)
-- ---------------------------------------------------------------------------

-- Events: end before start → align end to start (satisfies end_date >= start_date)
update public.events
set end_date = start_date
where end_date < start_date;

-- Users: approval_status is only meaningful for teachers (Admin clears it when role changes)
update public.users
set approval_status = null
where role is distinct from 'teacher'::user_role
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

-- Users: only teachers use approval_status
alter table public.users drop constraint if exists chk_users_approval_teacher_only;
alter table public.users
  add constraint chk_users_approval_teacher_only check (
    (role = 'teacher'::user_role) or (approval_status is null)
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
