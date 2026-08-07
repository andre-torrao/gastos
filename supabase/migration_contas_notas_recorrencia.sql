-- ============================================================
-- Corre isto UMA VEZ no SQL Editor do Supabase (depois do
-- migration_novas_cores.sql, se ainda nao o correste).
-- ============================================================

-- 1) Novas colunas: conta de origem e notas
alter table expenses add column if not exists account text not null default 'principal';
alter table expenses drop constraint if exists expenses_account_check;
alter table expenses add constraint expenses_account_check check (account in ('principal', 'poupanca'));
alter table expenses add column if not exists notes text;

-- 2) Substitui a funcao automatica para garantir que despesas recorrentes
--    tem sempre o mes seguinte pronto (corrige o caso do "Ginasio" e
--    quaisquer outras recorrencias criadas antes desta atualizacao).
create or replace function process_due_expenses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select * from expenses where due_date <= current_date and paid = false
  loop
    update expenses
      set paid = true, paid_date = r.due_date
      where id = r.id;
  end loop;

  for r in
    select * from expenses where recurring = true
  loop
    if not exists (
      select 1 from expenses
      where user_id = r.user_id
        and description = r.description
        and category_id is not distinct from r.category_id
        and moment_id is not distinct from r.moment_id
        and due_date = (r.due_date + interval '1 month')::date
    ) then
      insert into expenses (user_id, category_id, moment_id, description, amount, due_date, paid, recurring, account, notes)
      values (r.user_id, r.category_id, r.moment_id, r.description, r.amount, (r.due_date + interval '1 month')::date, false, true, r.account, r.notes);
    end if;
  end loop;
end;
$$;

grant execute on function process_due_expenses() to authenticated;

-- 3) Corre a funcao ja agora, para gerar imediatamente o mes seguinte
--    de recorrencias que ja tinhas criado (ex: Ginasio).
select process_due_expenses();
