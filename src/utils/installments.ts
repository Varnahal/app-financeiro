import { dayjs } from './date';

export interface Installment {
  installmentNumber: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

/**
 * Espelha a lógica de supabase/migrations/20260704000004_create_purchase_rpc.sql,
 * usada aqui só para preview no formulário (ex: "3x de R$100,00"). A criação real
 * das parcelas acontece no banco via RPC, para garantir atomicidade.
 */
export function splitPurchaseIntoInstallments(
  totalAmount: number,
  numInstallments: number,
  purchaseDate: string | Date
): Installment[] {
  if (numInstallments < 1) {
    throw new Error('numInstallments deve ser maior ou igual a 1');
  }

  const baseAmount = Math.trunc((totalAmount / numInstallments) * 100) / 100;
  const remainder = Math.round((totalAmount - baseAmount * numInstallments) * 100) / 100;
  const purchase = dayjs(purchaseDate);
  const day = purchase.date();

  const installments: Installment[] = [];
  for (let i = 1; i <= numInstallments; i += 1) {
    const targetMonth = purchase.add(i - 1, 'month').startOf('month');
    const lastDayOfMonth = targetMonth.endOf('month').date();
    const dueDate = targetMonth.date(Math.min(day, lastDayOfMonth));

    const rawAmount = i === numInstallments ? baseAmount + remainder : baseAmount;
    installments.push({
      installmentNumber: i,
      amount: Math.round(rawAmount * 100) / 100,
      dueDate: dueDate.format('YYYY-MM-DD'),
    });
  }

  return installments;
}
