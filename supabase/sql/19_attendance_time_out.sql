-- Optional checkout time per attendance row (after first QR scan / time in).
-- App: organiser scans the same student ATTEND QR a second time to set time out; rosters and exports show both times.

alter table public.attendance add column if not exists time_out_at timestamptz null;

alter table public.attendance drop constraint if exists chk_attendance_time_out_after_scan;
alter table public.attendance
  add constraint chk_attendance_time_out_after_scan check (
    time_out_at is null or time_out_at >= scanned_at
  );

comment on column public.attendance.time_out_at is
  'When the organiser scanned the student’s personal event QR the second time (time out); null until then. Must be on or after scanned_at.';
