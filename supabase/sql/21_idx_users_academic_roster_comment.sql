-- Optional on existing DBs: index was created in 04_indexes.sql; this only documents behavior.
-- Safe to re-run. Fails only if idx_users_academic_roster does not exist (run 04 first).
comment on index public.idx_users_academic_roster is
  'Default ordering for Admin → Users and attendance rosters (teacher / organiser / admin event roster) by academic_track, academic_year, academic_program. The app may expand/collapse tracks and department subgroups client-side; subgroup / name sort toggles are client-side; exports keep canonical ordering.';
