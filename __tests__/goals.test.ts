import type { Goal, TransactionWithRelations } from '@/types/database.types';
import { goalToFilters, progressRatio, spentForGoal } from '@/utils/goals';

function tx(over: Partial<TransactionWithRelations>): TransactionWithRelations {
  return {
    id: 'x',
    user_id: 'u',
    purchase_id: 'p',
    category_id: 'c',
    account_id: 'a',
    installment_number: 1,
    installments_total: 1,
    amount: 100,
    due_date: '2026-08-01',
    type: 'despesa',
    description: 'd',
    created_at: '2026-08-01',
    category: { id: 'c1', name: 'Alimentação', icon: null, color: null },
    account: { id: 'a1', name: 'Nubank', kind: 'cartao', color: null },
    purchase: {
      payment_method: 'cartao_credito',
      description: 'd',
      purchase_date: '2026-08-01',
      num_installments: 1,
      total_amount: 100,
      recurring_item_id: null,
    },
    ...over,
  };
}

function goal(over: Partial<Goal>): Goal {
  return {
    id: 'g',
    user_id: 'u',
    name: 'Meta',
    kind: 'gasto',
    target_amount: 500,
    filter_payment_methods: [],
    filter_category_ids: [],
    filter_account_ids: [],
    archived: false,
    created_at: '2026-08-01',
    ...over,
  };
}

describe('spentForGoal', () => {
  it('soma todas as despesas quando o escopo é vazio', () => {
    const txs = [tx({ amount: 100 }), tx({ amount: 50 }), tx({ amount: 30, type: 'receita' })];
    expect(spentForGoal(txs, goal({}))).toBe(150);
  });

  it('respeita o filtro por categoria', () => {
    const txs = [
      tx({ amount: 100, category: { id: 'c1', name: 'A', icon: null, color: null } }),
      tx({ amount: 40, category: { id: 'c2', name: 'B', icon: null, color: null } }),
    ];
    expect(spentForGoal(txs, goal({ filter_category_ids: ['c1'] }))).toBe(100);
  });

  it('respeita o filtro por forma de pagamento', () => {
    const txs = [
      tx({
        amount: 100,
        purchase: {
          payment_method: 'cartao_credito',
          description: 'd',
          purchase_date: '2026-08-01',
          num_installments: 1,
          total_amount: 100,
          recurring_item_id: null,
        },
      }),
      tx({
        amount: 40,
        purchase: {
          payment_method: 'pix',
          description: 'd',
          purchase_date: '2026-08-01',
          num_installments: 1,
          total_amount: 40,
          recurring_item_id: null,
        },
      }),
    ];
    expect(spentForGoal(txs, goal({ filter_payment_methods: ['cartao_credito'] }))).toBe(100);
  });

  it('nunca conta receitas', () => {
    const txs = [tx({ amount: 200, type: 'receita' })];
    expect(spentForGoal(txs, goal({}))).toBe(0);
  });
});

describe('goalToFilters', () => {
  it('mapeia os campos de escopo', () => {
    const g = goal({
      filter_category_ids: ['c1'],
      filter_account_ids: ['a1'],
      filter_payment_methods: ['pix'],
    });
    expect(goalToFilters(g)).toEqual({
      categoryIds: ['c1'],
      accountIds: ['a1'],
      paymentMethods: ['pix'],
    });
  });
});

describe('progressRatio', () => {
  it('calcula a razão', () => {
    expect(progressRatio(250, 500)).toBe(0.5);
  });
  it('protege contra alvo nulo ou zero', () => {
    expect(progressRatio(100, null)).toBe(0);
    expect(progressRatio(100, 0)).toBe(0);
  });
});
