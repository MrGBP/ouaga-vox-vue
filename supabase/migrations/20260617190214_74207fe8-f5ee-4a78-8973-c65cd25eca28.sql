
-- 1. Add new role value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_readonly';
