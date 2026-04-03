-- Academic enrollment columns on public.users (registration + student/teacher profiles).
-- App: src/constants/academicEnrollment.ts, Register.tsx, StudentProfile, TeacherProfile.
-- Safe to re-run.

alter table public.users add column if not exists academic_track text;
alter table public.users add column if not exists academic_year text;
alter table public.users add column if not exists academic_program text;

alter table public.users drop constraint if exists chk_users_academic_shape;
alter table public.users
  add constraint chk_users_academic_shape check (
    academic_track is null
    or (
      academic_track in ('junior_high', 'senior_high', 'college')
      and (
        (
          academic_track = 'junior_high'
          and academic_year in ('1', '2', '3', '4')
          and (academic_program is null or btrim(academic_program) = '')
        )
        or (
          academic_track = 'senior_high'
          and academic_year in ('11', '12')
          and (academic_program is null or btrim(academic_program) = '')
        )
        or (
          academic_track = 'college'
          and academic_year in ('1', '2', '3', '4')
          and academic_program is not null
          and btrim(academic_program) <> ''
        )
      )
    )
  );
