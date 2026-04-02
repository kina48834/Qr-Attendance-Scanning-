-- Run in SQL Editor to confirm demo rows exist (login reads these before Supabase Auth).
select id, email, role, left(password, 3) || '…' as password_preview
from public.users
order by email;
