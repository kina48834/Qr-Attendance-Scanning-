-- Ensure event QR payloads are auto-generated and unique.
-- Safe to re-run on existing databases.

update public.events
set qr_code_data = 'EVT-' || upper(encode(gen_random_bytes(12), 'hex'))
where qr_code_data is null
  or btrim(qr_code_data) = '';

with ranked as (
  select id, row_number() over (partition by qr_code_data order by created_at, id) as rn
  from public.events
)
update public.events e
set qr_code_data = 'EVT-' || upper(encode(gen_random_bytes(12), 'hex'))
from ranked r
where e.id = r.id
  and r.rn > 1;

alter table public.events
  alter column qr_code_data set default ('EVT-' || upper(encode(gen_random_bytes(12), 'hex')));
alter table public.events
  alter column qr_code_data set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'uq_events_qr_code_data'
  ) then
    alter table public.events add constraint uq_events_qr_code_data unique (qr_code_data);
  end if;
end $$;

comment on column public.events.qr_code_data is
  'Legacy unique EVT-<random> payload; app attendance uses student personal QR ATTEND:userId:eventId. Column kept for schema compatibility.';
comment on constraint uq_events_qr_code_data on public.events is
  'Guarantees every event QR payload is unique.';
