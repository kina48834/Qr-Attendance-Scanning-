-- Repair demo rows for table-password login (ids from 06_seed.sql).
-- Run in SQL Editor if demo accounts exist but sign-in fails (wrong email casing, changed password, etc.).
-- Does not touch other user rows.

update public.users
set
  email = lower(btrim(email)),
  password = case id
    when 'admin-1' then 'admin1919'
    when 'org-1' then 'organiser1919'
    when 'tea-1' then 'teacher1919'
    when 'stu-1' then 'student1919'
    else password
  end,
  approval_status = case id
    when 'tea-1' then 'approved'::teacher_approval_status
    else approval_status
  end
where id in ('admin-1', 'org-1', 'tea-1', 'stu-1');

select id, email, role, approval_status, left(password, 3) || '…' as pwd_preview
from public.users
where id in ('admin-1', 'org-1', 'tea-1', 'stu-1')
order by email;
