-- Reporting helper: attendance rows joined to `users.academic_*` for roster exports / analytics.
-- The app resolves enrollment in the client from `fetchUsers` + `fetchAttendance`; this view mirrors that join in SQL.

create or replace view public.v_attendance_with_user_enrollment as
select
  a.id as attendance_id,
  a.event_id,
  a.user_id,
  a.user_name,
  a.user_email,
  a.scanned_at,
  a.qr_code_data,
  u.academic_track,
  u.academic_year,
  u.academic_program,
  u.department
from public.attendance a
left join public.users u on u.id = a.user_id;

comment on view public.v_attendance_with_user_enrollment is
  'LEFT JOIN attendance to users for roster grouping: junior high (1–4 stored, UI Grade 7–10), senior high (11–12), college (years 1–4 + program); numbering restarts per level in the app (buildAttendanceTrackSections).';

grant select on public.v_attendance_with_user_enrollment to anon, authenticated;
