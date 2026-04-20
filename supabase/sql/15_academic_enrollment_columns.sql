-- Department / academic line columns on public.users (registration + student/teacher profiles).
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
          and (
            academic_program is null
            or btrim(academic_program) = ''
            or (
              academic_year = '1'
              and btrim(academic_program) in ('Skinner', 'Dewey', 'Freud', 'Locke', 'Pigget', 'Rousseau', 'Thorndike')
            )
            or (
              academic_year = '2'
              and btrim(academic_program) in (
                'Socrates',
                'Mencius',
                'Archimedes',
                'Aristotle',
                'Confucius',
                'Emerson',
                'Plato'
              )
            )
            or (
              academic_year = '3'
              and btrim(academic_program) in (
                'Rembrandt',
                'Braque',
                'Da Vinci',
                'Froebel',
                'Picasso',
                'Van Gogh',
                'Vermeer'
              )
            )
            or (
              academic_year = '4'
              and btrim(academic_program) in (
                'Vygotsky',
                'Ausubel',
                'Bruner',
                'Descartes',
                'Gardner',
                'Kohlberg',
                'Voltaire'
              )
            )
          )
        )
        or (
          academic_track = 'senior_high'
          and academic_year in ('11', '12')
          and (
            academic_program is null
            or btrim(academic_program) = ''
            or btrim(academic_program) in (
              'Business Entrepreneurship (BE)',
              'Arts, Social Sciences & Humanities (ASSH)',
              'Science, Technology, Engineering & Mathematics (STEM)',
              'Technical Professional (TECHPRO)'
            )
          )
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
