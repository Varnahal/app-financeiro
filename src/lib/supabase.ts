import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Importante: NÃO lançar erro aqui. Um throw no carregamento do módulo derruba
  // o app inteiro na hora (crash/tela branca), sem nenhuma mensagem — foi um dos
  // motivos de crash instantâneo no APK. Em vez disso, avisamos e seguimos com um
  // client de placeholder; as telas de login mostram um erro amigável ao usar.
  console.warn(
    'Configuração do Supabase ausente: defina EXPO_PUBLIC_SUPABASE_URL e ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY (.env). Veja o README.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
