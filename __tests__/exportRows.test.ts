import { buildExportData, TRANSACTION_HEADERS } from '@/utils/exportRows';
import type { TransactionWithRelations } from '@/types/database.types';

function makeTx(overrides: Partial<TransactionWithRelations>): TransactionWithRelations {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    purchase_id: 'purchase-1',
    category_id: 'cat-1',
    account_id: 'acc-1',
    installment_number: 1,
    installments_total: 1,
    amount: 100,
    due_date: '2026-01-15',
    type: 'despesa',
    description: 'Mercado do mês',
    created_at: '2026-01-15T00:00:00Z',
    category: { id: 'cat-1', name: 'Mercado', icon: null, color: null },
    account: { id: 'acc-1', name: 'Nubank', kind: 'cartao', color: null },
    purchase: {
      payment_method: 'pix',
      description: 'Mercado do mês',
      purchase_date: '2026-01-15',
      num_installments: 1,
      total_amount: 100,
      recurring_item_id: null,
    },
    ...overrides,
  };
}

describe('buildExportData', () => {
  it('gera cabeçalho + uma linha por transação, com valor assinado', () => {
    const { transactionRows } = buildExportData([
      makeTx({ amount: 50.5 }),
      makeTx({ id: 'tx-2', type: 'receita', amount: 3000, description: 'Salário' }),
    ]);

    expect(transactionRows[0]).toEqual(TRANSACTION_HEADERS);
    expect(transactionRows[1]).toEqual([
      '15/01/2026',
      'Mercado do mês',
      'Mercado',
      'Nubank',
      'Pix',
      'Despesa',
      '—',
      -50.5,
    ]);
    expect(transactionRows[2][5]).toBe('Receita');
    expect(transactionRows[2][7]).toBe(3000);
  });

  it('mostra a parcela quando a compra é parcelada', () => {
    const { transactionRows } = buildExportData([
      makeTx({ installment_number: 2, installments_total: 3 }),
    ]);
    expect(transactionRows[1][6]).toBe('2/3');
  });

  it('resumo traz receitas, despesas, saldo e despesas por categoria ordenadas', () => {
    const { summaryRows } = buildExportData([
      makeTx({ amount: 100 }),
      makeTx({
        id: 'tx-2',
        amount: 300,
        category: { id: 'cat-2', name: 'Moradia', icon: null, color: null },
      }),
      makeTx({ id: 'tx-3', type: 'receita', amount: 1000 }),
    ]);

    expect(summaryRows).toContainEqual(['Receitas', 1000]);
    expect(summaryRows).toContainEqual(['Despesas', -400]);
    expect(summaryRows).toContainEqual(['Saldo', 600]);

    const moradiaIndex = summaryRows.findIndex((r) => r[0] === 'Moradia');
    const mercadoIndex = summaryRows.findIndex((r) => r[0] === 'Mercado');
    expect(moradiaIndex).toBeGreaterThan(-1);
    expect(moradiaIndex).toBeLessThan(mercadoIndex); // maior despesa primeiro
  });

  it('usa traços para conta/categoria/pagamento ausentes', () => {
    const { transactionRows } = buildExportData([
      makeTx({ category: null, account: null, purchase: null }),
    ]);
    expect(transactionRows[1][2]).toBe('Sem categoria');
    expect(transactionRows[1][3]).toBe('—');
    expect(transactionRows[1][4]).toBe('—');
  });
});
