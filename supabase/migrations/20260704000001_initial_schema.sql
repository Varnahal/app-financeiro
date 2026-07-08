-- Buffa Finance: schema inicial
-- Tabelas: profiles, accounts, categories, purchases, transactions

create extension if not exists "pgcrypto";

-- Perfil de cada usuário autenticado. Criado automaticamente no signup (trigger abaixo).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
-- Nota: não há coluna de "grupo/household" agora (privacidade é 100% individual).
-- Se no futuro quisermos uma visão compartilhada entre amigos, dá para adicionar uma
-- coluna nullable (ex: household_id) aqui depois, sem quebrar nada do que já existe.

-- Contas/cartões definidos por cada usuário (ex: "Nubank", "Itaú", "Dinheiro").
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'conta' check (kind in ('conta', 'cartao', 'dinheiro', 'outro')),
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Categorias de transação. user_id nulo = categoria padrão global (visível a todos).
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  kind text not null default 'despesa' check (kind in ('receita', 'despesa', 'ambos')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Compra original (fonte da verdade). Uma compra parcelada gera N linhas em `transactions`.
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  type text not null check (type in ('receita', 'despesa')),
  category_id uuid not null references public.categories(id),
  account_id uuid not null references public.accounts(id),
  payment_method text not null check (
    payment_method in ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto')
  ),
  purchase_date date not null,
  num_installments int not null default 1 check (num_installments >= 1),
  created_at timestamptz not null default now()
);

-- Uma linha por parcela. category_id/account_id/type são duplicados aqui de propósito
-- para os gráficos poderem agregar direto, sem precisar de join com `purchases`.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  account_id uuid not null references public.accounts(id),
  installment_number int not null default 1,
  installments_total int not null default 1,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date not null,
  type text not null check (type in ('receita', 'despesa')),
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_due_date_idx on public.transactions (user_id, due_date);
create index if not exists transactions_purchase_idx on public.transactions (purchase_id);
create index if not exists purchases_user_date_idx on public.purchases (user_id, purchase_date);
create index if not exists accounts_user_idx on public.accounts (user_id);
create index if not exists categories_user_idx on public.categories (user_id);

-- Cria automaticamente uma linha em `profiles` quando um novo usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
