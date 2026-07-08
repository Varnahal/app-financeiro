import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

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
        <RootNavigator />
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
});
