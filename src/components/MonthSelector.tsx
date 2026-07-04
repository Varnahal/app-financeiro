import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { dayjs } from '@/utils/date';

interface MonthSelectorProps {
  month: Date;
  onChange: (month: Date) => void;
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  const label = dayjs(month).format('MMMM [de] YYYY');

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.arrow}
        onPress={() => onChange(dayjs(month).subtract(1, 'month').toDate())}
      >
        <Feather name="chevron-left" size={22} color={Colors.text} />
      </Pressable>
      <Text style={styles.label}>{capitalize(label)}</Text>
      <Pressable style={styles.arrow} onPress={() => onChange(dayjs(month).add(1, 'month').toDate())}>
        <Feather name="chevron-right" size={22} color={Colors.text} />
      </Pressable>
    </View>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  arrow: { padding: Spacing.sm },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text },
});
