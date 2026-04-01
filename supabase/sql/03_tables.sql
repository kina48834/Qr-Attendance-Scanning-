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
