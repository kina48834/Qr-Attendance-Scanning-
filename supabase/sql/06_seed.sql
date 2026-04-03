-- Seed data (teacher row must satisfy chk_users_teacher_staff_fields: phone, department, employee_id)
-- Demo user ids (admin-1, …) are not Supabase Auth UUIDs; the app signs them in via public.users password first (see 10_auth_public_users_alignment.sql).
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
    null,
    null,
    'College — BS Information Technology — First year',
    null,
    'college',
    '1',
    'BS Information Technology',
    now(),
    'student1919'
  )
on conflict (id) do nothing;

-- Drop legacy multi-event demo rows (safe if ids never existed)
delete from public.attendance where event_id in ('evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6');
delete from public.event_registrations where event_id in ('evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6');
delete from public.events where id in ('evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6');

-- Exactly one pre-created event: the system welcome event (organiser-owned, published for QR attendance).
insert into public.events
  (id, title, description, location, start_date, end_date, organiser_id, organiser_name, status, qr_code_data, max_attendees, created_at, updated_at)
values
  (
    'evt-1',
    'Welcome to Campus Connect',
    'Your welcome event — already in the system when Campus Connect starts. Meet the team, learn how to browse events, and scan the venue QR here to practice attendance. Teachers and admins can open this event to see who checked in.',
    'Main Hall',
    '2026-06-15T09:00:00Z',
    '2026-06-15T13:00:00Z',
    'org-1',
    'Organiser',
    'published',
    'EVT-evt-1',
    500,
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

-- Sample attendance so demo roster is non-empty (student scanned event QR)
insert into public.attendance (id, event_id, user_id, user_name, user_email, scanned_at, qr_code_data)
values
  ('att-seed-1', 'evt-1', 'stu-1', 'Student', 'student@gmail.com', now(), 'EVT-evt-1')
on conflict (event_id, user_id) do nothing;
