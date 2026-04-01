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
