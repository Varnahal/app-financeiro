-- Buffa Finance: recorrências (salário mensal e contas fixas, ex: internet)
--
-- Modelo: `recurring_items` é o "molde" da recorrência. Todo mês, a função
-- materialize_recurring_items() cria uma compra + transação reais para cada
-- recorrência ativa (chamada pelo app ao abrir). Como os meses passados viram
-- transações de verdade, mudar o valor do molde NÃO altera o histórico — a
-- função update_recurring_item_amount() só atualiza do mês atual em diante.

create table if not exists public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('receita', 'despesa')),
  category_id uuid not null references public.categories(id),
  account_id uuid not null references public.accounts(id),
  payment_method text not null check (
    payment_method in ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto')
  ),
  day_of_month int not null default 1 check (day_of_month between 1 and 31),
  start_month date not null default date_trunc('month', current_date),
  end_month date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists recurring_items_user_idx on public.recurring_items (user_id);

alter table public.recurring_items enable row level security;

drop policy if exists "recurring_select_own" on public.recurring_items;
create policy "recurring_select_own" on public.recurring_items
  for select using (auth.uid() = user_id);
drop policy if exists "recurring_insert_own" on public.recurring_items;
create policy "recurring_insert_own" on public.recurring_items
  for insert with check (auth.uid() = user_id);
drop policy if exists "recurring_update_own" on public.recurring_items;
create policy "recurring_update_own" on public.recurring_items
  for update using (auth.uid() = user_id);
drop policy if exists "recurring_delete_own" on public.recurring_items;
create policy "recurring_delete_own" on public.recurring_items
  for delete using (auth.uid() = user_id);

-- Liga cada ocorrência materializada de volta ao molde que a gerou.
alter table public.purchases
  add column if not exists recurring_item_id uuid references public.recurring_items(id) on delete set null;

create index if not exists purchases_recurring_idx on public.purchases (recurring_item_id)
  where recurring_item_id is not null;

-- Cria as ocorrências que faltam (do último mês já criado até o mês atual)
-- para todas as recorrências ativas do usuário logado. Idempotente: rodar
-- duas vezes no mesmo mês não duplica nada. Retorna quantas ocorrências criou.
create or replace function public.materialize_recurring_items()
returns int
language plpgsql
security invoker
as $$
declare
  r record;
  v_current_month date := date_trunc('month', current_date)::date;
  v_last_month date;
  v_month date;
  v_last_day int;
  v_due date;
  v_purchase_id uuid;
  v_created int := 0;
begin
  for r in
    select * from public.recurring_items
    where user_id = auth.uid() and active
  loop
    select max(date_trunc('month', p.purchase_date))::date
      into v_last_month
      from public.purchases p
      where p.recurring_item_id = r.id;

    v_month := coalesce((v_last_month + interval '1 month')::date, r.start_month);

    while v_month <= v_current_month loop
      exit when r.end_month is not null and v_month > r.end_month;

      -- Clamping de fim de mês: recorrência no dia 31 cai no dia 28/29/30
      -- nos meses mais curtos, sem vazar para o mês seguinte.
      v_last_day := extract(day from (v_month + interval '1 month - 1 day'))::int;
      v_due := make_date(
        extract(year from v_month)::int,
        extract(month from v_month)::int,
        least(r.day_of_month, v_last_day)
      );

      insert into public.purchases (
        user_id, description, total_amount, type, category_id, account_id,
        payment_method, purchase_date, num_installments, recurring_item_id
      ) values (
        auth.uid(), r.description, r.amount, r.type, r.category_id, r.account_id,
        r.payment_method, v_due, 1, r.id
      )
      returning id into v_purchase_id;

      insert into public.transactions (
        user_id, purchase_id, category_id, account_id,
        installment_number, installments_total, amount, due_date, type, description
      ) values (
        auth.uid(), v_purchase_id, r.category_id, r.account_id,
        1, 1, r.amount, v_due, r.type, r.description
      );

      v_created := v_created + 1;
      v_month := (v_month + interval '1 month')::date;
    end loop;
  end loop;

  return v_created;
end;
$$;

-- Atualiza o valor de uma recorrência preservando o histórico: os meses
-- passados ficam com o valor antigo; só o mês atual e os seguintes mudam.
create or replace function public.update_recurring_item_amount(
  p_item_id uuid,
  p_amount numeric
) returns void
language plpgsql
security invoker
as $$
declare
  v_current_month date := date_trunc('month', current_date)::date;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'O valor deve ser maior que zero';
  end if;

  update public.recurring_items
    set amount = p_amount
    where id = p_item_id and user_id = auth.uid();

  if not found then
    raise exception 'Recorrência não encontrada';
  end if;

  update public.transactions t
    set amount = p_amount
    from public.purchases p
    where t.purchase_id = p.id
      and p.recurring_item_id = p_item_id
      and t.user_id = auth.uid()
      and t.due_date >= v_current_month;

  update public.purchases p
    set total_amount = p_amount
    where p.recurring_item_id = p_item_id
      and p.user_id = auth.uid()
      and p.purchase_date >= v_current_month;
end;
$$;
