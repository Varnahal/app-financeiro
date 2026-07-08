import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const Y_AXIS_LABEL_WIDTH = 35;

interface MonthlyTrendChartProps {
  points: { label: string; net: number }[];
  availableWidth: number;
}

export function MonthlyTrendChart({ points, availableWidth }: MonthlyTrendChartProps) {
  // Rótulo mês sim, mês não: com 12 meses espremidos na largura do celular,
  // rotular todos os pontos faz os textos se sobreporem.
  const data: lineDataItem[] = points.map((p, i) => ({
    value: p.net,
    label: i % 2 === 0 ? p.label : '',
    labelTextStyle: { color: Colors.textMuted, fontSize: 10 },
  }));

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={availableWidth - Y_AXIS_LABEL_WIDTH}
        yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
        adjustToWidth
        disableScroll
        initialSpacing={10}
        color={Colors.primary}
        thickness={2}
        dataPointsColor={Colors.primary}
        yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        noOfSections={4}
        hideRules
        isAnimated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
});
