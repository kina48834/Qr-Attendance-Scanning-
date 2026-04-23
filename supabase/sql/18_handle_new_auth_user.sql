-- Sync Supabase Auth sign-ups to public.users (same id as auth.users.id).
-- Fixes: Auth user exists but no profile row → login / Admin approval list breaks.
-- Runs as SECURITY DEFINER so RLS does not block the insert.
-- Only provisions rows when raw_user_meta_data.role is student or teacher (app registration).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_role user_role;
  v_email text;
  v_name text;
  v_track text;
  v_year text;
  v_program text;
  v_phone text;
  v_emp text;
  v_office text;
  v_dept text;
  yr_label text;
  shape_ok boolean;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  if lower(coalesce(meta->>'role', '')) not in ('student', 'teacher') then
    return new;
  end if;

  begin
    v_role := (meta->>'role')::user_role;
  exception
    when others then
      return new;
  end;

  if v_role not in ('student'::user_role, 'teacher'::user_role) then
    return new;
  end if;

  v_email := lower(btrim(coalesce(new.email, '')));
  if v_email = '' then
    return new;
  end if;

  v_name := nullif(btrim(coalesce(meta->>'name', '')), '');
  if v_name is null then
    v_name := split_part(v_email, '@', 1);
  end if;

  v_track := nullif(btrim(meta->>'academic_track'), '');
  v_year := nullif(btrim(meta->>'academic_year'), '');
  v_program := nullif(btrim(meta->>'academic_program'), '');
  v_phone := nullif(btrim(meta->>'phone'), '');
  v_emp := nullif(btrim(meta->>'employee_id'), '');
  v_office := nullif(btrim(meta->>'office_location'), '');

  v_dept := null;
  shape_ok := true;
  if v_track is not null and v_year is not null then
    shape_ok :=
      (
        v_track = 'junior_high'
        and v_year in ('1', '2', '3', '4')
        and (
          (v_year = '1' and v_program in ('Skinner', 'Dewey', 'Freud', 'Locke', 'Pigget', 'Rousseau', 'Thorndike'))
          or (
            v_year = '2'
            and v_program in ('Socrates', 'Mencius', 'Archimedes', 'Aristotle', 'Confucius', 'Emerson', 'Plato')
          )
          or (
            v_year = '3'
            and v_program in ('Rembrandt', 'Braque', 'Da Vinci', 'Froebel', 'Picasso', 'Van Gogh', 'Vermeer')
          )
          or (
            v_year = '4'
            and v_program in ('Vygotsky', 'Ausubel', 'Bruner', 'Descartes', 'Gardner', 'Kohlberg', 'Voltaire')
          )
        )
      )
      or (
        v_track = 'senior_high'
        and v_year in ('11', '12')
        and v_program in (
          'Business Entrepreneurship (BE)',
          'Arts, Social Sciences & Humanities (ASSH)',
          'Science, Technology, Engineering & Mathematics (STEM)',
          'Technical Professional (TECHPRO)'
        )
      )
      or (
        v_track = 'college'
        and v_year in ('1', '2', '3', '4')
        and v_program is not null
        and btrim(v_program) <> ''
      );
    if shape_ok then
      if v_track = 'junior_high' then
        v_dept :=
          'Junior high — '
          || case v_year
            when '1' then 'Grade 7'
            when '2' then 'Grade 8'
            when '3' then 'Grade 9'
            when '4' then 'Grade 10'
          end
          || ' — '
          || coalesce(v_program, 'Section not set');
      elsif v_track = 'senior_high' then
        v_dept :=
          'Senior high — '
          || case v_year
            when '11' then 'Grade 11'
            when '12' then 'Grade 12'
          end
          || ' — '
          || coalesce(v_program, 'Strand not set');
      else
        yr_label :=
          case v_year
            when '1' then '1st'
            when '2' then '2nd'
            when '3' then '3rd'
            when '4' then '4th'
          end;
        v_dept := 'College — ' || v_program || ' — ' || yr_label;
      end if;
    else
      v_track := null;
      v_year := null;
      v_program := null;
      v_dept := null;
    end if;
  end if;

  if v_role = 'teacher'::user_role then
    v_phone := coalesce(v_phone, 'Not set');
    v_dept := coalesce(v_dept, 'General');
    v_emp := coalesce(v_emp, 'TBD-' || left(replace(new.id::text, '-', ''), 24));
  end if;

  begin
    insert into public.users (
      id,
      email,
      name,
      role,
      password,
      approval_status,
      phone,
      department,
      employee_id,
      office_location,
      academic_track,
      academic_year,
      academic_program,
      created_at
    )
    values (
      new.id,
      v_email,
      v_name,
      v_role,
      'supabase-auth',
      'pending'::teacher_approval_status,
      case when v_role = 'teacher'::user_role then v_phone else null end,
      v_dept,
      case when v_role = 'teacher'::user_role then v_emp else null end,
      v_office,
      v_track,
      v_year,
      v_program,
      coalesce(new.created_at, now())
    )
    on conflict (id) do update
    set
      email = excluded.email,
      name = excluded.name,
      role = excluded.role,
      password = excluded.password,
      approval_status = excluded.approval_status,
      phone = excluded.phone,
      department = excluded.department,
      employee_id = excluded.employee_id,
      office_location = excluded.office_location,
      academic_track = excluded.academic_track,
      academic_year = excluded.academic_year,
      academic_program = excluded.academic_program;
  exception
    when unique_violation then
      -- e.g. email already owned by another profile id; do not fail Auth signup
      null;
  end;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'After insert on auth.users: creates public.users row (pending) for student/teacher self-registration metadata; id matches auth.users.id.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
