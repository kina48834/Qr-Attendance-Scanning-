-- PostgREST access: anon + authenticated must reach public tables for the browser app.
-- Supabase usually applies this when tables are created in the Dashboard; SQL-only setups may miss it.
-- Safe to re-run.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.users to anon, authenticated;
grant select, insert, update, delete on table public.events to anon, authenticated;
grant select, insert, update, delete on table public.attendance to anon, authenticated;
grant select, insert, update, delete on table public.event_registrations to anon, authenticated;
