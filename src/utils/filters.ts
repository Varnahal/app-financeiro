import type { PaymentMethod, TransactionWithRelations } from '@/types/database.types';

export interface TransactionFilters {
  categoryIds: string[];
  accountIds: string[];
  paymentMethods: PaymentMethod[];
}

export const EMPTY_FILTERS: TransactionFilters = {
  categoryIds: [],
  accountIds: [],
  paymentMethods: [],
};

/** Quantas dimensões de filtro estão ativas (array não vazio). */
export function countActiveFilters(filters: TransactionFilters): number {
  return [filters.categoryIds, filters.accountIds, filters.paymentMethods].filter(
    (dimension) => dimension.length > 0
  ).length;
}

/**
 * Filtra transações no cliente. Dimensão com array vazio = sem filtro naquela
 * dimensão. Entre dimensões é E (todas precisam bater); dentro de uma dimensão
 * é OU (qualquer valor selecionado serve).
 */
export function applyTransactionFilters(
  transactions: TransactionWithRelations[],
  filters: TransactionFilters
): TransactionWithRelations[] {
  const { categoryIds, accountIds, paymentMethods } = filters;
  if (categoryIds.length === 0 && accountIds.length === 0 && paymentMethods.length === 0) {
    return transactions;
  }

  return transactions.filter((tx) => {
    if (categoryIds.length > 0 && (!tx.category || !categoryIds.includes(tx.category.id))) {
      return false;
    }
    if (accountIds.length > 0 && (!tx.account || !accountIds.includes(tx.account.id))) {
      return false;
    }
    if (
      paymentMethods.length > 0 &&
      (!tx.purchase || !paymentMethods.includes(tx.purchase.payment_method))
    ) {
      return false;
    }
    return true;
  });
}
