-- Optional checkout time per attendance row (after QR check-in).
-- Student records time out from History; rosters and exports show both times.

alter table public.attendance add column if not exists time_out_at timestamptz null;

alter table public.attendance drop constraint if exists chk_attendance_time_out_after_scan;
alter table public.attendance
  add constraint chk_attendance_time_out_after_scan check (
    time_out_at is null or time_out_at >= scanned_at
  );

comment on column public.attendance.time_out_at is
  'When the student tapped Time out on History; null until recorded. Must be on or after scanned_at (QR check-in).';
