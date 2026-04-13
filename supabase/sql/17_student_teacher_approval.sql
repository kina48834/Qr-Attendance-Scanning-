-- Student + teacher approval alignment (safe to re-run on existing databases).
-- App logic: Register/Login/AdminUsers + student/teacher route guards.

-- Clear approval for roles that should never use it.
update public.users
set approval_status = null
where role not in ('teacher'::user_role, 'student'::user_role)
  and approval_status is not null;

-- Allow approval_status for both student and teacher only.
alter table public.users drop constraint if exists chk_users_approval_teacher_only;
alter table public.users
  add constraint chk_users_approval_teacher_only check (
    (role in ('teacher'::user_role, 'student'::user_role)) or (approval_status is null)
  );

comment on column public.users.approval_status is
  'Student/teacher approval: pending on self-register, approved/rejected by admin in User management; null for administrator/organiser.';
