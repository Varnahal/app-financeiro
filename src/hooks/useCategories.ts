import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Category, TransactionType } from '@/types/database.types';

export function useCategories(type?: TransactionType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
    select: (categories) =>
      type ? categories.filter((c) => c.kind === type || c.kind === 'ambos') : categories,
  });
}
