import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart';
import { IncomeVsExpenseChart } from '@/components/charts/IncomeVsExpenseChart';
import { FilterButton, FilterSheet } from '@/components/FilterSheet';
import { MonthSelector } from '@/components/MonthSelector';
import { Spacing, WebMaxWidth, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { groupByCategory, groupByMonth } from '@/utils/aggregations';
import { dayjs, monthRange, monthsBetween } from '@/utils/date';
import { applyTransactionFilters, countActiveFilters, EMPTY_FILTERS } from '@/utils/filters';

export default function GraficosScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [categoryMonth, setCategoryMonth] = useState(new Date());
  // Período do gráfico de barras: por padrão os últimos 6 meses.
  const [startMonth, setStartMonth] = useState(() => dayjs().subtract(5, 'month').toDate());
  const [endMonth, setEndMonth] = useState(() => new Date());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // No web o app fica numa coluna central de largura máxima (WebMaxWidth), mas
  // useWindowDimensions() devolve a largura da JANELA inteira — numa tela grande
  // o gráfico era dimensionado com ~1900px e vazava para fora da coluna. Limita
  // à largura real da coluna. No nativo, a janela é a própria tela (sem mudança).
  const columnWidth = Platform.OS === 'web' ? Math.min(width, WebMaxWidth) : width;
  // Largura útil dentro dos cards: coluna − padding da tela (lg×2) − padding do card (md×2).
  const chartWidth = columnWidth - Spacing.lg * 2 - Spacing.md * 2;

  const periodMonths = useMemo(() => monthsBetween(startMonth, endMonth), [startMonth, endMonth]);

  // Consulta um intervalo que cobre tanto o período das barras quanto o mês do
  // gráfico de categorias (que navega livremente).
  const range = useMemo(() => {
    const categoryKey = dayjs(categoryMonth).format('YYYY-MM');
    const keys = [...periodMonths, categoryKey];
    const min = keys.reduce((acc, k) => (k < acc ? k : acc), keys[0]);
    const max = keys.reduce((acc, k) => (k > acc ? k : acc), keys[0]);
    return {
      start: `${min}-01`,
      end: monthRange(dayjs(`${max}-01`).toDate()).end,
    };
  }, [periodMonths, categoryMonth]);

  const { data: transactions, isLoading } = useTransactions(range);

  const filtered = useMemo(
    () => applyTransactionFilters(transactions ?? [], filters),
    [transactions, filters]
  );

  const monthlyTotals = useMemo(
    () => groupByMonth(filtered, periodMonths),
    [filtered, periodMonths]
  );

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
          <Text style={styles.cardTitle}>Receita x Despesa</Text>
          <View style={styles.periodRow}>
            <MonthStepper
              label="De"
              value={startMonth}
              onChange={setStartMonth}
              textColor={colors.text}
              mutedColor={colors.textMuted}
              styles={styles}
            />
            <MonthStepper
              label="Até"
              value={endMonth}
              onChange={setEndMonth}
              textColor={colors.text}
              mutedColor={colors.textMuted}
              styles={styles}
            />
          </View>
          <IncomeVsExpenseChart months={monthlyTotals} availableWidth={chartWidth} />
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

interface MonthStepperProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  textColor: string;
  mutedColor: string;
  styles: ReturnType<typeof makeStyles>;
}

function MonthStepper({ label, value, onChange, textColor, mutedColor, styles }: MonthStepperProps) {
  const monthLabel = dayjs(value).format('MMM/YY');
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          hitSlop={8}
          onPress={() => onChange(dayjs(value).subtract(1, 'month').toDate())}
        >
          <Feather name="chevron-left" size={18} color={mutedColor} />
        </Pressable>
        <Text style={[styles.stepperValue, { color: textColor }]}>{capitalize(monthLabel)}</Text>
        <Pressable hitSlop={8} onPress={() => onChange(dayjs(value).add(1, 'month').toDate())}>
          <Feather name="chevron-right" size={18} color={mutedColor} />
        </Pressable>
      </View>
    </View>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: Spacing.xs },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  stepper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stepperLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperValue: { fontSize: 14, fontWeight: '600' },
});
