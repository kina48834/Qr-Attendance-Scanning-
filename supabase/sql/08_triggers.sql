-- Reject setting event start/end in the past (organiser/admin/teacher forms + API).
-- Fully ended events (end_date < now()) may be edited without this check so titles/descriptions can be updated.

create or replace function public.events_validate_start_end_not_in_past()
returns trigger
language plpgsql
as $f$
begin
  if tg_op = 'INSERT' then
    if new.start_date < now() then
      raise exception 'events.start_date cannot be in the past';
    end if;
    if new.end_date < now() then
      raise exception 'events.end_date cannot be in the past';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.end_date >= now() then
      if new.start_date is distinct from old.start_date and new.start_date < now() then
        raise exception 'events.start_date cannot be moved to the past';
      end if;
      if new.end_date is distinct from old.end_date and new.end_date < now() then
        raise exception 'events.end_date cannot be moved to the past';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$f$;

drop trigger if exists trg_events_validate_future_dates on public.events;
create trigger trg_events_validate_future_dates
  before insert or update on public.events
  for each row
  execute function public.events_validate_start_end_not_in_past();

-- Keep events.updated_at in sync on every row update (dashboards, lists, analytics order by created_at/updated_at)

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_events_set_updated_at on public.events;
create trigger trg_events_set_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();
