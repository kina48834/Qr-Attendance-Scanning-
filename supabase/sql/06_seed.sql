-- Seed data (teacher row must satisfy chk_users_teacher_staff_fields: phone, department, employee_id)
-- Demo events temporarily disable `trg_events_validate_future_dates` so past / in-progress demo dates
-- always load (even DBs that never ran the relaxed `08_triggers.sql` function). Trigger is re-enabled after.
-- Demo user ids (admin-1, …) are not Supabase Auth UUIDs; the app signs them in via public.users password first (see 10_auth_public_users_alignment.sql).
-- Events: several rows so every role sees a populated Events list after import (students browse all published/draft events from Supabase).

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
    'College — BS Information Technology — 1st',
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

-- Remove old demo event ids before re-seeding (safe if missing)
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

-- Demo registrations (optional analytics)
insert into public.event_registrations (id, event_id, user_id, registered_at)
values
  ('reg-seed-1', 'evt-2', 'stu-1', now()),
  ('reg-seed-2', 'evt-4', 'stu-1', now())
on conflict (event_id, user_id) do nothing;

-- Sample attendance: demo student checked in to welcome event (QR payload matches personal ATTEND:stu-1:evt-1 for realism)
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

-- Second demo check-in (club fair), no time out yet
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
