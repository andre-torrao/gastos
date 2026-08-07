-- ============================================================
-- Corre isto UMA VEZ no SQL Editor do Supabase.
-- Atualiza as categorias que ja tinhas criado para a nova
-- paleta de cores e remove os emojis antigos guardados.
-- ============================================================

with ordered as (
  select id, user_id,
         row_number() over (partition by user_id order by created_at) - 1 as idx
  from macro_categories
),
palette(idx, hex) as (
  values (0, '#EFC94C'), (1, '#9CB380'), (2, '#A9C2E0'),
         (3, '#EFAFC4'), (4, '#B9A8D6'), (5, '#D9A98A')
)
update macro_categories mc
set color = p.hex, icon = ''
from ordered o
join palette p on p.idx = o.idx % 6
where mc.id = o.id;

update moments set icon = '';
