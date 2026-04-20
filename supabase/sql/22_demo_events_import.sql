-- Optional: import demo events + registrations + sample attendance only.
-- Prerequisites: public.users must include org-1, tea-1, stu-1 (run 06_seed.sql users block first, or full 00_all_in_one).
-- Temporarily disables `trg_events_validate_future_dates` around event INSERT so this file runs on any DB.
-- Safe to re-run: deletes demo event ids evt-1..evt-6 and re-inserts them.

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
    'Orientation-style welcome: students use My event QR; organisers scan for time in and again for time out.',
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
    'Meet student clubs and sign up.',
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
    'Draft event — not open for attendance until published.',
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
    'Inter-college sports.',
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
    'Past event for testing completed status.',
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
    'Owned by the demo teacher (tea-1).',
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
