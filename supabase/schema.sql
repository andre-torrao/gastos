-- ============================================================
-- Esquema da app "Gastos" para Supabase
-- Corre este ficheiro completo no SQL editor do teu projeto
-- Supabase (Project > SQL Editor > New query).
-- ============================================================

-- Extensao necessaria para o agendamento automatico (marcar
-- como pago / gerar o mes seguinte de despesas recorrentes).
create extension if not exists pg_cron with schema extensions;

-- ---------- Tabelas ----------

create table if not exists macro_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '🏷️',
  color text not null default '#4B2E56',
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  macro_category_id uuid not null references macro_categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '✨',
  color text not null default '#4B2E56',
  start_date date not null default current_date,
  end_date date,
  budget numeric,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references macro_categories(id) on delete set null,
  moment_id uuid references moments(id) on delete cascade,
  description text not null,
  amount numeric not null check (amount > 0),
  due_date date not null,
  paid boolean not null default false,
  paid_date date,
  recurring boolean not null default false,
  account text not null default 'principal' check (account in ('principal', 'poupanca')),
  notes text,
  created_at timestamptz not null default now()
);
-- nota: category_id pode apontar tanto para macro_categories.id (categoria
-- "geral") como para categories.id (subcategoria); a app trata os dois casos.

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget numeric
);

create index if not exists expenses_user_due_idx on expenses (user_id, due_date);
create index if not exists expenses_moment_idx on expenses (moment_id);

-- ---------- Row Level Security ----------

alter table macro_categories enable row level security;
alter table categories enable row level security;
alter table moments enable row level security;
alter table expenses enable row level security;
alter table user_settings enable row level security;

create policy "own macro_categories" on macro_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own moments" on moments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own expenses" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own settings" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Automatizacao: marcar como pago + repetir mensalmente ----------
-- Esta funcao corre com privilegios elevados (security definer) para poder
-- atualizar despesas de todos os utilizadores quando o cron a chama.
-- A app tambem a chama diretamente (via supabase.rpc) sempre que abre,
-- como rede de seguranca caso o cron ainda nao tenha corrido.

create or replace function process_due_expenses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  -- 1) marca como pagas as despesas cuja data ja chegou
  for r in
    select * from expenses where due_date <= current_date and paid = false
  loop
    update expenses
      set paid = true, paid_date = r.due_date
      where id = r.id;
  end loop;

  -- 2) garante que TODAS as despesas recorrentes (pagas ou nao, passadas
  --    ou futuras) tem sempre o lancamento do mes seguinte criado. Isto
  --    cobre tanto as recorrencias que acabaram de ser marcadas como pagas
  --    acima, como recorrencias antigas que ainda nao tinham sido geradas.
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

-- Permite que utilizadores autenticados chamem a funcao a partir da app
grant execute on function process_due_expenses() to authenticated;

-- Agenda a funcao para correr todos os dias as 00:05
do $migrate$
begin
  if not exists (select 1 from cron.job where jobname = 'process-due-expenses-daily') then
    perform cron.schedule(
      'process-due-expenses-daily',
      '5 0 * * *',
      'select process_due_expenses();'
    );
  end if;
end;
$migrate$;
