import { groupByCategory, groupByMonth } from '@/utils/aggregations';
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
    description: 'Teste',
    created_at: '2026-01-15T00:00:00Z',
    category: { id: 'cat-1', name: 'Mercado', icon: 'shopping-cart', color: '#f00' },
    account: { id: 'acc-1', name: 'Nubank', kind: 'cartao', color: null },
    ...overrides,
  };
}

describe('groupByCategory', () => {
  it('soma valores da mesma categoria e ignora o tipo oposto', () => {
    const result = groupByCategory(
      [
        makeTx({ amount: 50 }),
        makeTx({ amount: 30 }),
        makeTx({ type: 'receita', amount: 1000, category: { id: 'cat-2', name: 'Salário', icon: null, color: null } }),
      ],
      'despesa'
    );
    expect(result).toEqual([{ categoryId: 'cat-1', name: 'Mercado', color: '#f00', total: 80 }]);
  });
});

describe('groupByMonth', () => {
  it('preenche meses sem lançamento com zero', () => {
    const result = groupByMonth([makeTx({ due_date: '2026-01-15', amount: 40, type: 'despesa' })], [
      '2025-12',
      '2026-01',
    ]);
    expect(result).toEqual([
      { month: '2025-12', label: expect.any(String), receita: 0, despesa: 0 },
      { month: '2026-01', label: expect.any(String), receita: 0, despesa: 40 },
    ]);
  });
});
