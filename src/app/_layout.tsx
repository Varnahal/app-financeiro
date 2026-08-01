import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { WebMaxWidth, type ThemeColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme, useThemedStyles } from '@/hooks/useTheme';

const queryClient = new QueryClient();

// No navegador, confina o app numa coluna central de largura máxima (como um
// celular). No nativo (APK), não faz nada — retorna os filhos sem alteração.
function AppFrame({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webOuter}>
      <View style={styles.webColumn}>{children}</View>
    </View>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const styles = useThemedStyles(makeStyles);

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
        <Stack.Screen name="recorrentes" options={{ headerShown: true, title: 'Recorrentes' }} />
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

function ThemedApp() {
  const { scheme, colors } = useTheme();
  // Coordena o tema da navegação (headers/telas nativas) com o tema do app.
  const navTheme =
    scheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AppFrame>
        <RootNavigator />
      </AppFrame>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    webOuter: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.letterbox,
    },
    webColumn: {
      flex: 1,
      width: '100%',
      maxWidth: WebMaxWidth,
      backgroundColor: colors.background,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  });
