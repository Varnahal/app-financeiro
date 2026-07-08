-- Buffa Finance: categorias padrão (globais, user_id nulo, visíveis a todos os usuários)
--
-- A constraint unique (user_id, name) da tabela categories não impede duplicatas aqui,
-- porque no Postgres valores NULL nunca são considerados iguais entre si. Por isso o
-- "where not exists" abaixo: só semeia as categorias padrão se ainda não existir nenhuma
-- categoria global, evitando duplicar tudo caso este arquivo seja rodado mais de uma vez.

insert into public.categories (user_id, name, kind, icon)
select * from (
  values
    (null::uuid, 'Mercado', 'despesa', 'shopping-cart'),
    (null::uuid, 'Transporte', 'despesa', 'truck'),
    (null::uuid, 'Lazer', 'despesa', 'film'),
    (null::uuid, 'Saúde', 'despesa', 'heart'),
    (null::uuid, 'Moradia', 'despesa', 'home'),
    (null::uuid, 'Educação', 'despesa', 'book'),
    (null::uuid, 'Alimentação', 'despesa', 'coffee'),
    (null::uuid, 'Vestuário', 'despesa', 'shopping-bag'),
    (null::uuid, 'Contas e Serviços', 'despesa', 'file-text'),
    (null::uuid, 'Assinaturas', 'despesa', 'repeat'),
    (null::uuid, 'Viagem', 'despesa', 'map-pin'),
    (null::uuid, 'Outros', 'ambos', 'more-horizontal'),
    (null::uuid, 'Salário', 'receita', 'dollar-sign'),
    (null::uuid, 'Freelance', 'receita', 'briefcase'),
    (null::uuid, 'Investimentos', 'receita', 'trending-up'),
    (null::uuid, 'Presente', 'receita', 'gift')
) as seed(user_id, name, kind, icon)
where not exists (select 1 from public.categories where user_id is null);
