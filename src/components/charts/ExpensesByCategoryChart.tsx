import { PieChart, type pieDataItem } from 'react-native-gifted-charts';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';
import type { CategoryTotal } from '@/utils/aggregations';

const PALETTE = ['#208AEF', '#F97316', '#16A34A', '#DC2626', '#9333EA', '#0EA5E9', '#EAB308', '#64748B'];

interface ExpensesByCategoryChartProps {
  categories: CategoryTotal[];
  availableWidth: number;
}

export function ExpensesByCategoryChart({ categories, availableWidth }: ExpensesByCategoryChartProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const radius = Math.min(90, Math.floor(availableWidth / 2) - 10);
  const innerRadius = Math.round(radius * 0.61);

  if (categories.length === 0 || total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhuma despesa neste mês.</Text>
      </View>
    );
  }

  const data: pieDataItem[] = categories.map((c, i) => ({
    value: c.total,
    color: PALETTE[i % PALETTE.length],
    text: `${Math.round((c.total / total) * 100)}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <PieChart
          data={data}
          donut
          radius={radius}
          innerRadius={innerRadius}
          innerCircleColor={Platform.OS === 'web' ? colors.surface : undefined}
          innerCircleBorderWidth={0}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerLabelValue}>{formatCurrency(total)}</Text>
              <Text style={styles.centerLabelText}>Total</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.legend}>
        {categories.map((c, i) => (
          <View key={c.categoryId} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.legendValue}>{formatCurrency(c.total)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { alignItems: 'stretch' },
  chartWrapper: { alignItems: 'center', paddingVertical: Spacing.md },
  centerLabel: { alignItems: 'center' },
  centerLabelValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  centerLabelText: { fontSize: 11, color: colors.textMuted },
  legend: { marginTop: Spacing.md, gap: Spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: colors.text, fontSize: 14 },
  legendValue: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  empty: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textMuted },
});
