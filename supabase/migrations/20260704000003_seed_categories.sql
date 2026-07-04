-- Buffa Finance: categorias padrão (globais, user_id nulo, visíveis a todos os usuários)

insert into public.categories (user_id, name, kind, icon) values
  (null, 'Mercado', 'despesa', 'shopping-cart'),
  (null, 'Transporte', 'despesa', 'truck'),
  (null, 'Lazer', 'despesa', 'film'),
  (null, 'Saúde', 'despesa', 'heart'),
  (null, 'Moradia', 'despesa', 'home'),
  (null, 'Educação', 'despesa', 'book'),
  (null, 'Alimentação', 'despesa', 'coffee'),
  (null, 'Vestuário', 'despesa', 'shopping-bag'),
  (null, 'Contas e Serviços', 'despesa', 'file-text'),
  (null, 'Assinaturas', 'despesa', 'repeat'),
  (null, 'Viagem', 'despesa', 'map-pin'),
  (null, 'Outros', 'ambos', 'more-horizontal'),
  (null, 'Salário', 'receita', 'dollar-sign'),
  (null, 'Freelance', 'receita', 'briefcase'),
  (null, 'Investimentos', 'receita', 'trending-up'),
  (null, 'Presente', 'receita', 'gift');
