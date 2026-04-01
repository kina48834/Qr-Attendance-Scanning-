# Campus Connect

School event management system (React + Vite + TypeScript) powered by Supabase Postgres.

## Quick start

```bash
npm install
npm run dev
```

## Supabase environment

Create `.env` in the project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

- `VITE_` keys are used by the frontend.
- `SUPABASE_SECRET_KEY` and DB URL are server-only values (do not expose in frontend code).

## Where to see users in Supabase (important)

| Dashboard area | What it shows |
|----------------|----------------|
| **Authentication → Users** | Accounts created via **student/teacher registration** in the app. Supabase Auth stores the email/password here. |
| **Table Editor → `public` → `users`** | **All** app profiles: seeded admin/organiser/teacher/student, users added in **User management**, and every registered student/teacher. Role, approval, and staff fields live here. |

Seeded demo accounts (`admin-1`, `org-1`, …) exist only in **`public.users`** unless you also create matching users under Authentication. The app signs them in using the password stored in `public.users` (legacy path). New registrations use **Supabase Auth** first, then insert a row in `public.users` with the same `id` as the Auth user UUID.

For local development, turn off **Confirm email** under **Authentication → Providers → Email** so sign-up can complete immediately; otherwise users must confirm before `signUp` returns a usable session.

Rows created via Auth store the literal password marker `supabase-auth` in `public.users.password` (the real password is only in Auth).

## SQL setup

You can execute SQL in Supabase SQL Editor:

- **All-in-one:** `supabase/sql/00_all_in_one.sql`
- **Categorized files:** run `01`–`04`, then `07`–`09`, then `05`–`06` (see `supabase/sql/README.md`)

The frontend reads and writes **only** through Supabase; it does **not** insert seed rows. Run **`06_seed.sql`** (or the all-in-one script) at least once so demo users and events exist, or create data from the app after an admin signs in.

## Supabase CLI (optional)

```bash
supabase login
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Frontend dev server (port 3000) |
| `npm run build` | Type check and build frontend |
| `npm run preview` | Preview production build |
| `npm run clean` | Remove `dist` output |
