-- Buffa Finance: cria uma compra e todas as suas parcelas de forma atômica.
-- Evita compras "órfãs" (sem parcelas) caso a conexão caia no meio do processo,
-- e centraliza o cálculo de arredondamento e de datas de vencimento.

create or replace function public.create_purchase_with_installments(
  p_description text,
  p_total_amount numeric,
  p_type text,
  p_category_id uuid,
  p_account_id uuid,
  p_payment_method text,
  p_purchase_date date,
  p_num_installments int
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_purchase_id uuid;
  v_base_amount numeric(12, 2);
  v_remainder numeric(12, 2);
  v_target_month date;
  v_day int;
  v_last_day int;
  v_due_date date;
  i int;
begin
  if p_num_installments < 1 then
    raise exception 'num_installments deve ser maior ou igual a 1';
  end if;

  insert into public.purchases (
    user_id, description, total_amount, type, category_id, account_id,
    payment_method, purchase_date, num_installments
  ) values (
    auth.uid(), p_description, p_total_amount, p_type, p_category_id, p_account_id,
    p_payment_method, p_purchase_date, p_num_installments
  )
  returning id into v_purchase_id;

  -- Cada parcela recebe o valor truncado; a última parcela absorve o resto do
  -- arredondamento, garantindo que a soma das parcelas bata exatamente com o total.
  v_base_amount := trunc(p_total_amount / p_num_installments, 2);
  v_remainder := p_total_amount - (v_base_amount * p_num_installments);
  v_day := extract(day from p_purchase_date)::int;

  for i in 1..p_num_installments loop
    -- Aritmética de "mês + intervalo" do Postgres não trava no fim do mês
    -- (31/jan + 1 mês = 03/mar, não 28/fev), então fazemos o clamping manualmente.
    v_target_month := (date_trunc('month', p_purchase_date) + ((i - 1) || ' months')::interval)::date;
    v_last_day := extract(day from (date_trunc('month', v_target_month) + interval '1 month - 1 day'))::int;
    v_due_date := make_date(
      extract(year from v_target_month)::int,
      extract(month from v_target_month)::int,
      least(v_day, v_last_day)
    );

    insert into public.transactions (
      user_id, purchase_id, category_id, account_id,
      installment_number, installments_total, amount, due_date, type, description
    ) values (
      auth.uid(), v_purchase_id, p_category_id, p_account_id,
      i, p_num_installments,
      case when i = p_num_installments then v_base_amount + v_remainder else v_base_amount end,
      v_due_date, p_type,
      case
        when p_num_installments > 1 then p_description || ' (' || i || '/' || p_num_installments || ')'
        else p_description
      end
    );
  end loop;

  return v_purchase_id;
end;
$$;
