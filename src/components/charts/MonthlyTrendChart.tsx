import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface MonthlyTrendChartProps {
  points: { label: string; net: number }[];
}

export function MonthlyTrendChart({ points }: MonthlyTrendChartProps) {
  const data: lineDataItem[] = points.map((p) => ({
    value: p.net,
    label: p.label,
    labelTextStyle: { color: Colors.textMuted, fontSize: 10 },
  }));

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        color={Colors.primary}
        thickness={2}
        dataPointsColor={Colors.primary}
        yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        noOfSections={4}
        areaChart
        startFillColor={Colors.primary}
        endFillColor={Colors.primary}
        startOpacity={0.25}
        endOpacity={0.02}
        hideRules
        isAnimated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
});
