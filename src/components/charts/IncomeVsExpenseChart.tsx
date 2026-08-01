import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { MonthlyTotal } from '@/utils/aggregations';
import { formatCompactCurrency } from '@/utils/currency';

const Y_AXIS_LABEL_WIDTH = 35;
const PAIR_SPACING = 2; // entre as duas barras do mesmo mês
const GROUP_SPACING = 14; // entre meses
const EDGE_SPACING = 8;
// Abaixo desta largura por mês as barras ficariam ilegíveis, então entra rolagem
// horizontal em vez de espremer tudo na tela.
const MIN_MONTH_WIDTH = 56;

interface IncomeVsExpenseChartProps {
  months: MonthlyTotal[];
  availableWidth: number;
}

export function IncomeVsExpenseChart({ months, availableWidth }: IncomeVsExpenseChartProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const chartWidth = availableWidth - Y_AXIS_LABEL_WIDTH;
  const n = Math.max(1, months.length);

  // Largura que cada mês (par de barras + espaçamento) ocupa para caber exato.
  const fitMonthWidth = (chartWidth - 2 * EDGE_SPACING) / n;
  // Se não couber com largura legível, deixa rolar e usa a largura mínima.
  const scroll = fitMonthWidth < MIN_MONTH_WIDTH;
  const monthWidth = scroll ? MIN_MONTH_WIDTH : fitMonthWidth;
  const barWidth = Math.max(6, Math.floor((monthWidth - GROUP_SPACING - PAIR_SPACING) / 2));

  const topLabel = (value: number) =>
    value > 0
      ? () => (
          <Text style={styles.topLabel} numberOfLines={1}>
            {formatCompactCurrency(value)}
          </Text>
        )
      : undefined;

  const data: barDataItem[] = months.flatMap((m) => [
    {
      value: m.receita,
      label: m.label,
      spacing: PAIR_SPACING,
      labelWidth: 2 * barWidth + PAIR_SPACING,
      labelTextStyle: { color: colors.textMuted, fontSize: 10 },
      frontColor: colors.success,
      topLabelComponent: topLabel(m.receita),
    },
    { value: m.despesa, frontColor: colors.danger, topLabelComponent: topLabel(m.despesa) },
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
        disableScroll={!scroll}
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
  topLabel: { color: colors.textMuted, fontSize: 9, width: 46, textAlign: 'center', marginBottom: 2 },
});
