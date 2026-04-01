-- Seed data (teacher row must satisfy chk_users_teacher_staff_fields: phone, department, employee_id)
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
