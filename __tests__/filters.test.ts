import {
  applyTransactionFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  type TransactionFilters,
} from '@/utils/filters';
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
    category: { id: 'cat-1', name: 'Mercado', icon: null, color: null },
    account: { id: 'acc-1', name: 'Nubank', kind: 'cartao', color: null },
    purchase: { payment_method: 'pix' },
    ...overrides,
  };
}

function filters(partial: Partial<TransactionFilters>): TransactionFilters {
  return { ...EMPTY_FILTERS, ...partial };
}

describe('applyTransactionFilters', () => {
  it('sem filtros ativos retorna todas as transações', () => {
    const txs = [makeTx({ id: 'a' }), makeTx({ id: 'b' })];
    expect(applyTransactionFilters(txs, EMPTY_FILTERS)).toEqual(txs);
  });

  it('filtra por uma categoria', () => {
    const txs = [
      makeTx({ id: 'a' }),
      makeTx({ id: 'b', category: { id: 'cat-2', name: 'Lazer', icon: null, color: null } }),
    ];
    const result = applyTransactionFilters(txs, filters({ categoryIds: ['cat-2'] }));
    expect(result.map((t) => t.id)).toEqual(['b']);
  });

  it('múltiplas contas selecionadas funcionam como OU', () => {
    const txs = [
      makeTx({ id: 'a' }),
      makeTx({ id: 'b', account: { id: 'acc-2', name: 'Itaú', kind: 'conta', color: null } }),
      makeTx({ id: 'c', account: { id: 'acc-3', name: 'Dinheiro', kind: 'dinheiro', color: null } }),
    ];
    const result = applyTransactionFilters(txs, filters({ accountIds: ['acc-1', 'acc-3'] }));
    expect(result.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('dimensões diferentes combinam como E', () => {
    const txs = [
      makeTx({ id: 'a', purchase: { payment_method: 'cartao_credito' } }),
      makeTx({ id: 'b' }), // categoria certa, pagamento errado (pix)
      makeTx({
        id: 'c',
        category: { id: 'cat-2', name: 'Lazer', icon: null, color: null },
        purchase: { payment_method: 'cartao_credito' },
      }), // pagamento certo, categoria errada
    ];
    const result = applyTransactionFilters(
      txs,
      filters({ categoryIds: ['cat-1'], paymentMethods: ['cartao_credito'] })
    );
    expect(result.map((t) => t.id)).toEqual(['a']);
  });

  it('filtro de pagamento exclui transações sem purchase', () => {
    const txs = [makeTx({ id: 'a', purchase: null })];
    expect(applyTransactionFilters(txs, filters({ paymentMethods: ['pix'] }))).toEqual([]);
  });

  it('filtro de categoria exclui transações sem categoria', () => {
    const txs = [makeTx({ id: 'a', category: null })];
    expect(applyTransactionFilters(txs, filters({ categoryIds: ['cat-1'] }))).toEqual([]);
  });

  it('retorna vazio quando nada bate', () => {
    const txs = [makeTx({ id: 'a' })];
    expect(applyTransactionFilters(txs, filters({ accountIds: ['acc-999'] }))).toEqual([]);
  });
});

describe('countActiveFilters', () => {
  it('zero para EMPTY_FILTERS', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it('conta dimensões ativas, não valores', () => {
    expect(
      countActiveFilters(filters({ categoryIds: ['a', 'b'], paymentMethods: ['pix'] }))
    ).toBe(2);
  });
});
