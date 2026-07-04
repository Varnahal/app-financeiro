import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { MonthlyTotal } from '@/utils/aggregations';

interface IncomeVsExpenseChartProps {
  months: MonthlyTotal[];
}

export function IncomeVsExpenseChart({ months }: IncomeVsExpenseChartProps) {
  const data: barDataItem[] = months.flatMap((m) => [
    {
      value: m.receita,
      label: m.label,
      spacing: 2,
      labelWidth: 36,
      labelTextStyle: { color: Colors.textMuted, fontSize: 10 },
      frontColor: Colors.success,
    },
    { value: m.despesa, frontColor: Colors.danger },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <LegendDot color={Colors.success} label="Receita" />
        <LegendDot color={Colors.danger} label="Despesa" />
      </View>
      <BarChart
        data={data}
        barWidth={14}
        spacing={20}
        roundedTop
        noOfSections={4}
        yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        hideRules
        isAnimated
      />
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.sm },
  legendRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: Colors.textMuted, fontSize: 13 },
});
