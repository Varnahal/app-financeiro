import { PAYMENT_METHOD_LABELS } from '@/constants/categories';
import type { Goal, TransactionWithRelations } from '@/types/database.types';
import { applyTransactionFilters, type TransactionFilters } from '@/utils/filters';

/** Converte o escopo de uma meta de gasto nos filtros de transação equivalentes. */
export function goalToFilters(goal: Goal): TransactionFilters {
  return {
    categoryIds: goal.filter_category_ids ?? [],
    accountIds: goal.filter_account_ids ?? [],
    paymentMethods: goal.filter_payment_methods ?? [],
  };
}

/**
 * Total de despesas (dentro das transações passadas, tipicamente as do mês) que
 * batem no escopo da meta de gasto. Escopo vazio = todas as despesas.
 */
export function spentForGoal(
  transactions: TransactionWithRelations[],
  goal: Goal
): number {
  return applyTransactionFilters(transactions, goalToFilters(goal))
    .filter((tx) => tx.type === 'despesa')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/** Razão de progresso (0..∞), protegida contra alvo nulo/zero. */
export function progressRatio(value: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  return value / target;
}

/**
 * Descrição curta e legível do escopo de uma meta de gasto, resolvendo os ids
 * para nomes. Escopo vazio = "Todas as despesas".
 */
export function describeGoalScope(
  goal: Goal,
  categoryNames: Record<string, string>,
  accountNames: Record<string, string>
): string {
  const parts: string[] = [];
  for (const id of goal.filter_category_ids ?? []) {
    parts.push(categoryNames[id] ?? 'Categoria');
  }
  for (const id of goal.filter_account_ids ?? []) {
    parts.push(accountNames[id] ?? 'Conta');
  }
  for (const method of goal.filter_payment_methods ?? []) {
    parts.push(PAYMENT_METHOD_LABELS[method]);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Todas as despesas';
}
