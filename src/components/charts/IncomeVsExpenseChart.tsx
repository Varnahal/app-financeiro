import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { MonthlyTotal } from '@/utils/aggregations';

const Y_AXIS_LABEL_WIDTH = 35;
const PAIR_SPACING = 2; // entre as duas barras do mesmo mês
const GROUP_SPACING = 12; // entre meses
const EDGE_SPACING = 8;

interface IncomeVsExpenseChartProps {
  months: MonthlyTotal[];
  availableWidth: number;
}

export function IncomeVsExpenseChart({ months, availableWidth }: IncomeVsExpenseChartProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const chartWidth = availableWidth - Y_AXIS_LABEL_WIDTH;
  const n = Math.max(1, months.length);
  // Largura de barra calculada para o conjunto caber exatamente na tela, sem scroll.
  const barWidth = Math.max(
    6,
    Math.floor((chartWidth - 2 * EDGE_SPACING - n * PAIR_SPACING - (n - 1) * GROUP_SPACING) / (2 * n))
  );

  const data: barDataItem[] = months.flatMap((m) => [
    {
      value: m.receita,
      label: m.label,
      spacing: PAIR_SPACING,
      labelWidth: 2 * barWidth + PAIR_SPACING,
      labelTextStyle: { color: colors.textMuted, fontSize: 10 },
      frontColor: colors.success,
    },
    { value: m.despesa, frontColor: colors.danger },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <LegendDot color={colors.success} label="Receita" />
        <LegendDot color={colors.danger} label="Despesa" />
      </View>
      <BarChart
        data={data}
        width={chartWidth}
        yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
        barWidth={barWidth}
        spacing={GROUP_SPACING}
        initialSpacing={EDGE_SPACING}
        endSpacing={EDGE_SPACING}
        disableScroll
        roundedTop
        noOfSections={4}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        hideRules
        isAnimated
      />
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { paddingVertical: Spacing.sm },
  legendRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 13 },
});
