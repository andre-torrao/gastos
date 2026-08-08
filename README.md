# Bolso + — app pessoal de gestão de despesas

App em Next.js + Supabase para substituir o teu Excel. Permite:

- Registar gastos com **tipo (categoria), valor e data**
- Vista **mensal**, com gráfico em anel por categorias-macro (inspirado nas imagens que enviaste)
- Gastos **recorrentes**: marcam-se como pagos automaticamente na data e geram já o lançamento do mês seguinte
- **Momentos personalizados** (ex: "Viagem de fim de ano"): agrupam gastos fora do ciclo mensal, com orçamento opcional
- Categorias-macro + subcategorias editáveis

## 1. Criar o projeto Supabase

1. Vai a [supabase.com](https://supabase.com) → **New project**.
2. Depois de criado, vai a **SQL Editor → New query**, cola todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e corre (**Run**).
   - Isto cria as tabelas, ativa a segurança por utilizador (RLS) e agenda
     automaticamente (via `pg_cron`) a rotina que, todos os dias às 00:05,
     marca como pagas as despesas cuja data chegou e cria o mês seguinte
     das despesas recorrentes.
   - Se o `create extension pg_cron` der erro de permissões, ativa a
     extensão manualmente em **Database → Extensions → pg_cron** e corre o
     script outra vez.
3. Vai a **Authentication → Providers** e confirma que **Email** está ativo.
   Como é uma app pessoal, recomendo desativar **"Allow new users to sign
   up"** depois de criares a tua conta (Authentication → Settings), para
   que mais ninguém se possa registar.
4. Vai a **Project Settings → API** e copia:
   - `Project URL`
   - `anon public` key

## 2. Correr localmente

```bash
npm install
cp .env.local.example .env.local
# edita .env.local e cola o URL + anon key do Supabase
npm run dev
```

Abre `http://localhost:3000`, cria a tua conta (email + palavra-passe) e
começa a usar.

## 3. Publicar (GitHub + Vercel)

1. Cria um repositório novo no GitHub e envia este código:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão da app de gastos"
   git branch -M main
   git remote add origin https://github.com/O-TEU-USER/gastos.git
   git push -u origin main
   ```
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importa o
   repositório.
3. Em **Environment Variables**, adiciona:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. A partir daí, cada `git push` atualiza a app automaticamente.

## Se já tinhas a app a correr (atualizações)

Sempre que eu te enviar um novo zip com alterações à base de dados, vais
encontrar ficheiros `supabase/migration_*.sql`. Corre-os por ordem no SQL
Editor do Supabase (uma vez cada) e depois sobe o novo código para o GitHub.

## Como funciona a atualização automática

- A tabela `expenses` tem `due_date` (data de pagamento), `paid` e `recurring`.
- Uma função SQL (`process_due_expenses`) corre todos os dias via `pg_cron`
  e marca como pagas as despesas com `due_date` já chegada; se forem
  recorrentes, cria logo o lançamento do mês seguinte.
- A app também chama essa função sempre que abres o dashboard, como
  segurança extra caso o `pg_cron` ainda não tenha corrido nesse dia.

## Estrutura

```
app/
  page.tsx            → dashboard mensal (anel de categorias, lista, +)
  login/page.tsx       → entrar / criar conta
  moments/page.tsx     → lista de momentos personalizados
  moments/[id]/page.tsx→ detalhe de um momento (gastos + orçamento)
  categories/page.tsx  → gerir categorias-macro e subcategorias
components/            → UI reutilizável (formulário, lista, anel, nav)
lib/                    → cliente Supabase, tipos, categorias por omissão
supabase/schema.sql     → esquema da base de dados + automação
```

## Personalizar

- Cores/ícones das categorias-macro por omissão: `lib/defaultCategories.ts`
- Paleta de cores: `tailwind.config.ts` e `lib/types.ts` (`PALETTE`)
- Limite mensal: botão de engrenagem no topo do dashboard
