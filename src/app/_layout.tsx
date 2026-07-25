import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Colors, WebLetterbox, WebMaxWidth } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

// No navegador, confina o app numa coluna central de largura máxima (como um
// celular). No nativo (APK), não faz nada — retorna os filhos sem alteração.
function AppFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webOuter}>
      <View style={styles.webColumn}>{children}</View>
    </View>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="transacao/nova"
          options={{ presentation: 'modal', headerShown: true, title: 'Nova Transação' }}
        />
        <Stack.Screen
          name="transacao/[id]"
          options={{ presentation: 'modal', headerShown: true, title: 'Transação' }}
        />
        <Stack.Screen
          name="transacao/editar/[id]"
          options={{ presentation: 'modal', headerShown: true, title: 'Editar Transação' }}
        />
        <Stack.Screen
          name="recorrentes"
          options={{ headerShown: true, title: 'Recorrentes' }}
        />
        <Stack.Screen
          name="recorrente/nova"
          options={{ presentation: 'modal', headerShown: true, title: 'Nova Recorrência' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppFrame>
          <RootNavigator />
        </AppFrame>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  webOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: WebLetterbox,
  },
  webColumn: {
    flex: 1,
    width: '100%',
    maxWidth: WebMaxWidth,
    backgroundColor: Colors.background,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
});
