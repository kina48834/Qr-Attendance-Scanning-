-- Performance indexes
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
