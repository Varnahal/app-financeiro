import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';

const MIN = 1;
const MAX = 24;

interface InstallmentInputProps {
  value: number;
  onChange: (value: number) => void;
  totalAmount: number;
}

export function InstallmentInput({ value, onChange, totalAmount }: InstallmentInputProps) {
  const perInstallment = totalAmount > 0 ? totalAmount / value : 0;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Parcelas</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(Math.max(MIN, value - 1))}
          disabled={value <= MIN}
        >
          <Feather name="minus" size={18} color={value <= MIN ? Colors.border : Colors.primary} />
        </Pressable>
        <Text style={styles.stepValue}>{value}x</Text>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(Math.min(MAX, value + 1))}
          disabled={value >= MAX}
        >
          <Feather name="plus" size={18} color={value >= MAX ? Colors.border : Colors.primary} />
        </Pressable>
      </View>
      {value > 1 && (
        <Text style={styles.preview}>
          {value}x de {formatCurrency(perInstallment)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: Spacing.md },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xs },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  stepButton: { padding: Spacing.sm },
  stepValue: { fontSize: 18, fontWeight: '700', color: Colors.text, minWidth: 40, textAlign: 'center' },
  preview: { textAlign: 'center', marginTop: Spacing.xs, color: Colors.textMuted, fontSize: 13 },
});
