import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart';
import { IncomeVsExpenseChart } from '@/components/charts/IncomeVsExpenseChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { FilterButton, FilterSheet } from '@/components/FilterSheet';
import { MonthSelector } from '@/components/MonthSelector';
import { Colors, Spacing } from '@/constants/theme';
import { useTransactions } from '@/hooks/useTransactions';
import { groupByCategory, groupByMonth, monthlyNetTrend } from '@/utils/aggregations';
import { lastMonths, monthRange } from '@/utils/date';
import { applyTransactionFilters, countActiveFilters, EMPTY_FILTERS } from '@/utils/filters';

const MONTHS_WINDOW = 12;
const BAR_CHART_MONTHS = 6;

export default function GraficosScreen() {
  const { width } = useWindowDimensions();
  const [categoryMonth, setCategoryMonth] = useState(new Date());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // Largura útil dentro dos cards: tela − padding da tela (lg×2) − padding do card (md×2).
  const chartWidth = width - Spacing.lg * 2 - Spacing.md * 2;

  const months = useMemo(() => lastMonths(MONTHS_WINDOW), []);
  const range = useMemo(
    () => ({
      start: `${months[0]}-01`,
      end: monthRange(new Date()).end,
    }),
    [months]
  );

  const { data: transactions, isLoading } = useTransactions(range);

  const filtered = useMemo(
    () => applyTransactionFilters(transactions ?? [], filters),
    [transactions, filters]
  );

  const monthlyTotals = useMemo(() => groupByMonth(filtered, months), [filtered, months]);

  const categoryData = useMemo(() => {
    const { start, end } = monthRange(categoryMonth);
    const inMonth = filtered.filter((tx) => tx.due_date >= start && tx.due_date <= end);
    return groupByCategory(inMonth, 'despesa');
  }, [filtered, categoryMonth]);

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
        <View style={styles.toolbar}>
          <Text style={styles.screenTitle}>Gráficos</Text>
          <FilterButton
            activeCount={countActiveFilters(filters)}
            onPress={() => setFilterOpen(true)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Despesas por categoria</Text>
          <MonthSelector month={categoryMonth} onChange={setCategoryMonth} />
          <ExpensesByCategoryChart categories={categoryData} availableWidth={chartWidth} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Receita x Despesa (últimos {BAR_CHART_MONTHS} meses)
          </Text>
          <IncomeVsExpenseChart
            months={monthlyTotals.slice(-BAR_CHART_MONTHS)}
            availableWidth={chartWidth}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saldo mensal</Text>
          <MonthlyTrendChart points={monthlyNetTrend(monthlyTotals)} availableWidth={chartWidth} />
        </View>
      </ScrollView>

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
});
