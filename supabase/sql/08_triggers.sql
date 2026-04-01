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
