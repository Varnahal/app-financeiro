import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Account, AccountKind } from '@/types/database.types';

export function useAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accounts', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('archived', false)
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, kind }: { name: string; kind: AccountKind }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('accounts')
        .insert({ user_id: user.id, name, kind, color: null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
    },
  });
}

export function useRenameAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, name }: { accountId: string; name: string }) => {
      const { error } = await supabase.from('accounts').update({ name }).eq('id', accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      // O nome aparece nas linhas de transação (join), então recarrega elas também.
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });
}

/**
 * "Exclui" uma conta preservando o histórico: se nenhuma transação/recorrência
 * referencia a conta, apaga de verdade; senão, arquiva (some dos seletores e
 * da lista, mas as transações antigas continuam mostrando o nome dela).
 */
export function useDeleteAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', accountId);
      if (!error) return;
      // 23503 = violação de chave estrangeira: a conta tem transações,
      // compras ou recorrências apontando para ela — arquiva em vez de apagar.
      if (error.code === '23503') {
        const { error: archiveError } = await supabase
          .from('accounts')
          .update({ archived: true })
          .eq('id', accountId);
        if (archiveError) throw archiveError;
        return;
      }
      throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
    },
  });
}
