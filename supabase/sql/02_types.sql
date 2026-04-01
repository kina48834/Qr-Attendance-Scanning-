-- Enumerations
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('administrator', 'organiser', 'student', 'teacher');
  end if;
  if not exists (select 1 from pg_type where typname = 'teacher_approval_status') then
    create type teacher_approval_status as enum ('approved', 'pending', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('draft', 'published', 'completed', 'cancelled');
  end if;
end $$;
