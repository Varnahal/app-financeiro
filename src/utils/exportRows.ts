import { PAYMENT_METHOD_LABELS } from '@/constants/categories';
import { formatDate } from './date';
import type { TransactionWithRelations } from '@/types/database.types';

export type SheetRow = (string | number)[];

export interface ExportData {
  /** Linhas da aba "Transações" (primeira linha = cabeçalho). */
  transactionRows: SheetRow[];
  /** Linhas da aba "Resumo" (totais e despesas por categoria). */
  summaryRows: SheetRow[];
}

export const TRANSACTION_HEADERS = [
  'Data',
  'Descrição',
  'Categoria',
  'Conta',
  'Forma de pagamento',
  'Tipo',
  'Parcela',
  'Valor',
];

/**
 * Monta as linhas das duas abas da planilha. O "Valor" é assinado (receita
 * positiva, despesa negativa) para o SOMA do Excel dar o saldo direto.
 */
export function buildExportData(transactions: TransactionWithRelations[]): ExportData {
  const transactionRows: SheetRow[] = [TRANSACTION_HEADERS];

  let totalReceitas = 0;
  let totalDespesas = 0;
  const despesasPorCategoria = new Map<string, number>();

  for (const tx of transactions) {
    const isReceita = tx.type === 'receita';
    const signedAmount = isReceita ? tx.amount : -tx.amount;
    const categoria = tx.category?.name ?? 'Sem categoria';

    if (isReceita) {
      totalReceitas += tx.amount;
    } else {
      totalDespesas += tx.amount;
      despesasPorCategoria.set(categoria, (despesasPorCategoria.get(categoria) ?? 0) + tx.amount);
    }

    transactionRows.push([
      formatDate(tx.due_date),
      tx.description,
      categoria,
      tx.account?.name ?? '—',
      tx.purchase ? PAYMENT_METHOD_LABELS[tx.purchase.payment_method] : '—',
      isReceita ? 'Receita' : 'Despesa',
      tx.installments_total > 1 ? `${tx.installment_number}/${tx.installments_total}` : '—',
      round2(signedAmount),
    ]);
  }

  const summaryRows: SheetRow[] = [
    ['Resumo do período', ''],
    ['Receitas', round2(totalReceitas)],
    ['Despesas', round2(-totalDespesas)],
    ['Saldo', round2(totalReceitas - totalDespesas)],
    ['', ''],
    ['Despesas por categoria', ''],
    ...Array.from(despesasPorCategoria.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, total]): SheetRow => [name, round2(-total)]),
  ];

  return { transactionRows, summaryRows };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
