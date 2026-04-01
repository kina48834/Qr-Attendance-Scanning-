-- Auth vs public.users (demo / Vercel)
-- -------------------------------
-- Seed rows in public.users use fixed ids (e.g. admin-1) and plain passwords in `password`.
-- Supabase Authentication users have a UUID `id` in auth.users; your app profile row must use
-- the SAME id in public.users for the Auth sign-in path (see Register flow).
--
-- If you create Authentication users for the same emails as seed accounts (admin@gmail.com, …)
-- without a matching public.users row (same UUID), sign-in used to fail with "no profile".
-- The app now tries the table password first for seed accounts, then Supabase Auth.
--
-- Optional cleanup (Dashboard is easiest): Authentication → Users → delete duplicate users for
-- demo emails if you only want table-password login for those accounts.
--
-- No DDL below — safe to run as-is (empty transaction).

select 1 as auth_public_users_alignment_note;
