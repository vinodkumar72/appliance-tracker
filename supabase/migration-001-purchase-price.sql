-- Adds the appliance purchase price column.
-- For databases that already ran schema.sql before 2026-08-22.
alter table public.appliances add column if not exists purchase_price numeric;
