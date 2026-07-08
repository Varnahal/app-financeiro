import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { PaymentMethod, RecurringItem, TransactionType } from '@/types/database.types';

export function useRecurringItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RecurringItem[]> => {
      const { data, error } = await supabase
        .from('recurring_items')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface CreateRecurringInput {
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  payment_method: PaymentMethod;
  day_of_month: number;
}

export function useCreateRecurringItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecurringInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('recurring_items')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      // Materializa já a ocorrência do mês atual, para aparecer na hora.
      const { error: rpcError } = await supabase.rpc('materialize_recurring_items');
      if (rpcError) throw rpcError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });
}

/** Muda o valor preservando o histórico: só o mês atual e os futuros mudam. */
export function useUpdateRecurringAmount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, amount }: { itemId: string; amount: number }) => {
      const { error } = await supabase.rpc('update_recurring_item_amount', {
        p_item_id: itemId,
        p_amount: amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });
}

/** Encerra a recorrência: para de gerar novos meses; o que já existe fica. */
export function useDeactivateRecurring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('recurring_items')
        .update({ active: false })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', user?.id] });
    },
  });
}

/**
 * Chama a materialização uma vez por sessão (ao abrir o app logado), criando
 * as ocorrências dos meses que passaram desde o último uso. Se algo foi
 * criado, recarrega as transações.
 */
export function useMaterializeRecurring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ranForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user || ranForUser.current === user.id) return;
    ranForUser.current = user.id;

    supabase
      .rpc('materialize_recurring_items')
      .then(({ data, error }) => {
        if (!error && typeof data === 'number' && data > 0) {
          queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
        }
      });
  }, [user, queryClient]);
}
