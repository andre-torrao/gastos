-- ============================================================
-- Corre isto UMA VEZ no SQL Editor do Supabase.
-- ============================================================

-- 1) Data opcional de fim para gastos recorrentes ("recorrente ate...")
alter table expenses add column if not exists recurring_until date;

-- 2) Nova opcao de conta: Subsidio de Refeicao
alter table expenses drop constraint if exists expenses_account_check;
alter table expenses add constraint expenses_account_check
  check (account in ('principal', 'poupanca', 'subsidio_refeicao'));

-- 3) Atualiza a automatizacao para respeitar a data de fim das recorrencias
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
    if r.recurring_until is not null and (r.due_date + interval '1 month')::date > r.recurring_until then
      continue;
    end if;
    if not exists (
      select 1 from expenses
      where user_id = r.user_id
        and description = r.description
        and category_id is not distinct from r.category_id
        and moment_id is not distinct from r.moment_id
        and due_date = (r.due_date + interval '1 month')::date
    ) then
      insert into expenses (user_id, category_id, moment_id, description, amount, due_date, paid, recurring, recurring_until, account, notes)
      values (r.user_id, r.category_id, r.moment_id, r.description, r.amount, (r.due_date + interval '1 month')::date, false, true, r.recurring_until, r.account, r.notes);
    end if;
  end loop;
end;
$$;

grant execute on function process_due_expenses() to authenticated;
