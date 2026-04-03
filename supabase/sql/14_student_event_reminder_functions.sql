-- Student reminders (optional server-side mirror of app logic in studentEventReminders.ts).
-- The browser app computes these lists from events + attendance; these functions help SQL reports and RPC.

create or replace function public.student_events_open_no_attendance(p_user_id text)
returns setof public.events
language sql
stable
as $$
  select e.*
  from public.events e
  where e.status = 'published'
    and e.end_date >= now()
    and not exists (
      select 1 from public.attendance a
      where a.event_id = e.id and a.user_id = p_user_id
    )
  order by e.start_date asc;
$$;

create or replace function public.student_events_missed_no_attendance(p_user_id text)
returns setof public.events
language sql
stable
as $$
  select e.*
  from public.events e
  where e.status in ('published', 'completed')
    and e.end_date < now()
    and not exists (
      select 1 from public.attendance a
      where a.event_id = e.id and a.user_id = p_user_id
    )
  order by e.end_date desc;
$$;

grant execute on function public.student_events_open_no_attendance(text) to anon, authenticated;
grant execute on function public.student_events_missed_no_attendance(text) to anon, authenticated;

-- Total count for UI badges (same as studentReminderTotalCount in src/utils/studentEventReminders.ts).
create or replace function public.student_reminders_count(p_user_id text)
returns integer
language sql
stable
as $$
  select coalesce(
    (select count(*)::int
     from public.events e
     where e.status = 'published'
       and e.end_date >= now()
       and not exists (
         select 1 from public.attendance a
         where a.event_id = e.id and a.user_id = p_user_id
       )),
    0
  )
  + coalesce(
    (select count(*)::int
     from public.events e
     where e.status in ('published', 'completed')
       and e.end_date < now()
       and not exists (
         select 1 from public.attendance a
         where a.event_id = e.id and a.user_id = p_user_id
       )),
    0
  );
$$;

grant execute on function public.student_reminders_count(text) to anon, authenticated;
