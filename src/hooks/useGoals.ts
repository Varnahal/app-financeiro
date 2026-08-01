import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Goal, GoalContribution, GoalKind, PaymentMethod } from '@/types/database.types';

export function useGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGoal(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal', id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Goal | null> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface CreateGoalInput {
  name: string;
  kind: GoalKind;
  target_amount: number | null;
  filter_payment_methods?: PaymentMethod[];
  filter_category_ids?: string[];
  filter_account_ids?: string[];
}

export function useCreateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: input.name,
          kind: input.kind,
          target_amount: input.target_amount,
          filter_payment_methods: input.filter_payment_methods ?? [],
          filter_category_ids: input.filter_category_ids ?? [],
          filter_account_ids: input.filter_account_ids ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
}

export function useUpdateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, changes }: { goalId: string; changes: Partial<Goal> }) => {
      const { error } = await supabase.from('goals').update(changes).eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
    },
  });
}

/** "Exclui" a meta: arquiva (some da lista, mas o histórico da caixinha fica). */
export function useDeleteGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
}

export function useGoalContributions(goalId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal-contributions', goalId],
    enabled: !!user && !!goalId,
    queryFn: async (): Promise<GoalContribution[]> => {
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('goal_id', goalId as string)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Saldo de todas as caixinhas do usuário, indexado por goal_id. Uma única
 * consulta serve a lista inteira de metas na aba, sem N requisições.
 */
export function useGoalBalances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal-balances', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('goal_id, amount');
      if (error) throw error;
      const balances: Record<string, number> = {};
      for (const row of data ?? []) {
        balances[row.goal_id] = (balances[row.goal_id] ?? 0) + Number(row.amount);
      }
      return balances;
    },
  });
}

export interface AddContributionInput {
  goalId: string;
  amount: number; // positivo = depósito, negativo = retirada
  note?: string;
}

export function useAddContribution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, amount, note }: AddContributionInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('goal_contributions').insert({
        user_id: user.id,
        goal_id: goalId,
        amount,
        note: note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal-contributions', variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-balances', user?.id] });
    },
  });
}
