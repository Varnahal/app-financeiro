import { dayjs, formatMonthLabel } from './date';
import type { TransactionWithRelations } from '@/types/database.types';

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

const FALLBACK_COLOR = '#94a3b8';

/** Soma despesas (ou receitas) por categoria dentro do período das transações passadas. */
export function groupByCategory(
  transactions: TransactionWithRelations[],
  type: 'despesa' | 'receita' = 'despesa'
): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    const categoryId = tx.category?.id ?? 'sem-categoria';
    const existing = totals.get(categoryId);
    if (existing) {
      existing.total += tx.amount;
    } else {
      totals.set(categoryId, {
        categoryId,
        name: tx.category?.name ?? 'Sem categoria',
        color: tx.category?.color ?? FALLBACK_COLOR,
        total: tx.amount,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

export interface MonthlyTotal {
  month: string; // YYYY-MM
  label: string; // "Jan/26"
  receita: number;
  despesa: number;
}

/** Agrupa receitas e despesas por mês (due_date), preenchendo com zero os meses sem lançamento. */
export function groupByMonth(
  transactions: TransactionWithRelations[],
  months: string[]
): MonthlyTotal[] {
  const totals = new Map<string, MonthlyTotal>(
    months.map((month) => [
      month,
      { month, label: formatMonthLabel(`${month}-01`), receita: 0, despesa: 0 },
    ])
  );

  for (const tx of transactions) {
    const month = dayjs(tx.due_date).format('YYYY-MM');
    const bucket = totals.get(month);
    if (!bucket) continue;
    if (tx.type === 'receita') bucket.receita += tx.amount;
    else bucket.despesa += tx.amount;
  }

  return months.map((month) => totals.get(month)!);
}

/** Saldo (receita - despesa) por mês, útil para o gráfico de tendência. */
export function monthlyNetTrend(monthlyTotals: MonthlyTotal[]): { label: string; net: number }[] {
  return monthlyTotals.map((m) => ({ label: m.label, net: m.receita - m.despesa }));
}
