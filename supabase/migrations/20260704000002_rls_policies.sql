-- Buffa Finance: Row Level Security
-- Garante que cada usuário só enxerga e altera os próprios dados.

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.purchases enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "accounts_select_own" on public.accounts;
create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);
drop policy if exists "accounts_insert_own" on public.accounts;
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);
drop policy if exists "accounts_update_own" on public.accounts;
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id);
drop policy if exists "accounts_delete_own" on public.accounts;
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);

drop policy if exists "categories_select_own_or_global" on public.categories;
create policy "categories_select_own_or_global" on public.categories
  for select using (user_id is null or user_id = auth.uid());
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid());
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid());
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete using (user_id = auth.uid());

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases
  for select using (auth.uid() = user_id);
drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own" on public.purchases
  for insert with check (auth.uid() = user_id);
drop policy if exists "purchases_update_own" on public.purchases;
create policy "purchases_update_own" on public.purchases
  for update using (auth.uid() = user_id);
drop policy if exists "purchases_delete_own" on public.purchases;
create policy "purchases_delete_own" on public.purchases
  for delete using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);
