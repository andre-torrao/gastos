-- ============================================================
-- Corre isto UMA VEZ no SQL Editor do Supabase.
-- Adiciona o tipo "credito" aos Momentos.
-- ============================================================

alter table moments add column if not exists type text not null default 'moment';
alter table moments drop constraint if exists moments_type_check;
alter table moments add constraint moments_type_check check (type in ('moment', 'credit'));
