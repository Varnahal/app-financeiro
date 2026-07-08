import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';

import { Colors } from '@/constants/theme';
import { useMaterializeRecurring } from '@/hooks/useRecurringItems';

export default function TabsLayout() {
  // Ao abrir o app logado, cria as ocorrências de recorrências (salário,
  // contas fixas) dos meses que ainda não foram gerados.
  useMaterializeRecurring();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Transações',
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="graficos"
        options={{
          title: 'Gráficos',
          tabBarIcon: ({ color, size }) => <Feather name="pie-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
