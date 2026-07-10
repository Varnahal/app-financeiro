import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type {
  CreatePurchaseParams,
  TransactionWithRelations,
  UpdatePurchaseParams,
} from '@/types/database.types';

const TRANSACTION_SELECT = `
  *,
  category:categories(id, name, icon, color),
  account:accounts(id, name, kind, color),
  purchase:purchases(payment_method, description, purchase_date, num_installments, total_amount, recurring_item_id)
`;

/** Busca avulsa (fora do cache do react-query), usada pela exportação. */
export async function fetchTransactionsInRange(range: {
  start: string;
  end: string;
}): Promise<TransactionWithRelations[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .gte('due_date', range.start)
    .lte('due_date', range.end)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data as unknown as TransactionWithRelations[]) ?? [];
}

export function useTransactions(range?: { start: string; end: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id, range?.start, range?.end],
    enabled: !!user,
    queryFn: async (): Promise<TransactionWithRelations[]> => {
      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .order('due_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (range) {
        query = query.gte('due_date', range.start).lte('due_date', range.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TransactionWithRelations[]) ?? [];
    },
  });
}

export function useTransaction(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transaction', id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<TransactionWithRelations | null> => {
      const { data, error } = await supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TransactionWithRelations | null;
    },
  });
}

export function useCreatePurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePurchaseParams) => {
      const { data, error } = await supabase.rpc('create_purchase_with_installments', params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });
}

export function useUpdatePurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdatePurchaseParams) => {
      const { error } = await supabase.rpc('update_purchase_fields', params);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
    },
  });
}

export function useDeletePurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (purchaseId: string) => {
      const { error } = await supabase.from('purchases').delete().eq('id', purchaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });
}
