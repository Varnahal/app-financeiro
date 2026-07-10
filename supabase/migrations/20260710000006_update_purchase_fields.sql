-- Buffa Finance: editar uma transação já registrada (corrigir lançamentos).
--
-- Como uma transação é uma parcela de uma compra (purchases + transactions),
-- a edição atualiza as duas tabelas de forma atômica:
--   - Compra à vista (1x): edita tudo (valor, data, descrição, tipo, categoria,
--     conta, forma de pagamento).
--   - Compra parcelada (Nx): edita só os campos compartilhados (descrição,
--     tipo, categoria, conta, forma de pagamento) em todas as parcelas —
--     valor/data/nº de parcelas não mudam por aqui (para isso, exclua e recrie).

create or replace function public.update_purchase_fields(
  p_purchase_id uuid,
  p_description text,
  p_total_amount numeric,
  p_type text,
  p_category_id uuid,
  p_account_id uuid,
  p_payment_method text,
  p_purchase_date date
) returns void
language plpgsql
security invoker
as $$
declare
  v_num int;
begin
  select num_installments into v_num
    from public.purchases
    where id = p_purchase_id and user_id = auth.uid();

  if not found then
    raise exception 'Compra não encontrada';
  end if;

  if v_num = 1 then
    update public.purchases set
      description = p_description,
      total_amount = p_total_amount,
      type = p_type,
      category_id = p_category_id,
      account_id = p_account_id,
      payment_method = p_payment_method,
      purchase_date = p_purchase_date
      where id = p_purchase_id and user_id = auth.uid();

    update public.transactions set
      description = p_description,
      amount = p_total_amount,
      type = p_type,
      category_id = p_category_id,
      account_id = p_account_id,
      due_date = p_purchase_date
      where purchase_id = p_purchase_id and user_id = auth.uid();
  else
    update public.purchases set
      description = p_description,
      type = p_type,
      category_id = p_category_id,
      account_id = p_account_id,
      payment_method = p_payment_method
      where id = p_purchase_id and user_id = auth.uid();

    -- Reaplica o sufixo "(i/n)" na descrição de cada parcela.
    update public.transactions set
      type = p_type,
      category_id = p_category_id,
      account_id = p_account_id,
      description = p_description || ' (' || installment_number || '/' || installments_total || ')'
      where purchase_id = p_purchase_id and user_id = auth.uid();
  end if;
end;
$$;
