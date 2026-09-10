-- Adds user phone and company address/phone (invited-owner profile completion).
-- For databases that already ran schema.sql before 2026-08-28.
alter table public.app_users add column if not exists phone text;
alter table public.organizations add column if not exists address text;
alter table public.organizations add column if not exists phone text;
