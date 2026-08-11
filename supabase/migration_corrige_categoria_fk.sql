-- ============================================================
-- Corre isto UMA VEZ no SQL Editor do Supabase.
-- Corrige o erro "violates foreign key constraint
-- expenses_category_id_fkey" ao escolher uma subcategoria.
--
-- O campo category_id guarda tanto ids de categorias-macro como
-- de subcategorias (dependendo do que escolheste no formulário),
-- por isso não pode ter uma foreign key fixa só para uma tabela.
-- ============================================================

alter table expenses drop constraint if exists expenses_category_id_fkey;
