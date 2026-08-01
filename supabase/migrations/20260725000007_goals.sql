-- Buffa Finance: metas (goals)
--
-- Dois tipos de meta, na mesma tabela (coluna `kind`):
--
-- 1. 'gasto'  — limite de gasto mensal. O progresso é calculado no app somando
--    as despesas do mês que batem no escopo (filtros opcionais por forma de
--    pagamento / categoria / conta; vazio = todas as despesas). Nada é gravado
--    aqui além da configuração da meta.
--
-- 2. 'caixinha' — objetivo de poupança (estilo "caixinha do Nubank"). O saldo é
--    a soma das contribuições (depósitos positivos e retiradas negativas)
--    registradas manualmente em `goal_contributions`. `target_amount` é o
--    objetivo (opcional para caixinha).
--
-- Idempotente: seguro rodar mais de uma vez (if not exists / drop policy).

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('gasto', 'caixinha')),
  -- gasto: limite mensal (> 0). caixinha: objetivo opcional (pode ser nulo).
  target_amount numeric(12, 2),
  filter_payment_methods text[] not null default '{}',
  filter_category_ids uuid[] not null default '{}',
  filter_account_ids uuid[] not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  -- Limite de gasto sempre precisa de um valor positivo; caixinha não.
  constraint goals_gasto_needs_target check (
    kind <> 'gasto' or (target_amount is not null and target_amount > 0)
  )
);

create index if not exists goals_user_idx on public.goals (user_id);

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  -- positivo = depósito, negativo = retirada. Nunca zero.
  amount numeric(12, 2) not null check (amount <> 0),
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists goal_contributions_goal_idx
  on public.goal_contributions (goal_id);

alter table public.goal_contributions enable row level security;

drop policy if exists "goal_contrib_select_own" on public.goal_contributions;
create policy "goal_contrib_select_own" on public.goal_contributions
  for select using (auth.uid() = user_id);
drop policy if exists "goal_contrib_insert_own" on public.goal_contributions;
create policy "goal_contrib_insert_own" on public.goal_contributions
  for insert with check (auth.uid() = user_id);
drop policy if exists "goal_contrib_update_own" on public.goal_contributions;
create policy "goal_contrib_update_own" on public.goal_contributions
  for update using (auth.uid() = user_id);
drop policy if exists "goal_contrib_delete_own" on public.goal_contributions;
create policy "goal_contrib_delete_own" on public.goal_contributions
  for delete using (auth.uid() = user_id);
