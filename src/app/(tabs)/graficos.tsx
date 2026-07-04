import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart';
import { IncomeVsExpenseChart } from '@/components/charts/IncomeVsExpenseChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { MonthSelector } from '@/components/MonthSelector';
import { Colors, Spacing } from '@/constants/theme';
import { useTransactions } from '@/hooks/useTransactions';
import { groupByCategory, groupByMonth, monthlyNetTrend } from '@/utils/aggregations';
import { lastMonths, monthRange } from '@/utils/date';

const MONTHS_WINDOW = 12;

export default function GraficosScreen() {
  const [categoryMonth, setCategoryMonth] = useState(new Date());

  const months = useMemo(() => lastMonths(MONTHS_WINDOW), []);
  const range = useMemo(
    () => ({
      start: `${months[0]}-01`,
      end: monthRange(new Date()).end,
    }),
    [months]
  );

  const { data: transactions, isLoading } = useTransactions(range);

  const monthlyTotals = useMemo(
    () => groupByMonth(transactions ?? [], months),
    [transactions, months]
  );

  const categoryData = useMemo(() => {
    const { start, end } = monthRange(categoryMonth);
    const filtered = (transactions ?? []).filter(
      (tx) => tx.due_date >= start && tx.due_date <= end
    );
    return groupByCategory(filtered, 'despesa');
  }, [transactions, categoryMonth]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Despesas por categoria</Text>
          <MonthSelector month={categoryMonth} onChange={setCategoryMonth} />
          <ExpensesByCategoryChart categories={categoryData} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receita x Despesa (últimos 12 meses)</Text>
          <IncomeVsExpenseChart months={monthlyTotals} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saldo mensal</Text>
          <MonthlyTrendChart points={monthlyNetTrend(monthlyTotals)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
});
