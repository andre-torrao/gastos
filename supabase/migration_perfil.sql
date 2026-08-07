-- ============================================================
-- Corre isto UMA VEZ no SQL Editor do Supabase.
-- Adiciona o nome de perfil que aparece no "Ola, ..." do dashboard.
-- ============================================================

alter table user_settings add column if not exists display_name text;
