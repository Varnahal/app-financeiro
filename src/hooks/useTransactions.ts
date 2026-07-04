import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type {
  CreatePurchaseParams,
  TransactionDetail,
  TransactionWithRelations,
} from '@/types/database.types';

const TRANSACTION_SELECT = `
  *,
  category:categories(id, name, icon, color),
  account:accounts(id, name, kind, color)
`;

const TRANSACTION_DETAIL_SELECT = `
  ${TRANSACTION_SELECT},
  purchase:purchases(payment_method)
`;

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
    queryFn: async (): Promise<TransactionDetail | null> => {
      const { data, error } = await supabase
        .from('transactions')
        .select(TRANSACTION_DETAIL_SELECT)
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TransactionDetail | null;
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
