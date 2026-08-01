import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { getCategoryIcon } from '@/constants/categories';
import { formatCurrency } from '@/utils/currency';
import type { TransactionWithRelations } from '@/types/database.types';

interface TransactionListItemProps {
  transaction: TransactionWithRelations;
  onPress: () => void;
}

export function TransactionListItem({ transaction, onPress }: TransactionListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const isReceita = transaction.type === 'receita';
  const isParcelado = transaction.installments_total > 1;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.icon, { backgroundColor: isReceita ? '#E7F7EC' : '#FDEBEB' }]}>
        <Feather
          name={getCategoryIcon(transaction.category?.icon)}
          size={18}
          color={isReceita ? colors.success : colors.danger}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {transaction.category?.name ?? 'Sem categoria'} · {transaction.account?.name ?? '—'}
          {isParcelado ? ` · ${transaction.installment_number}/${transaction.installments_total}` : ''}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isReceita ? colors.success : colors.text }]}>
        {isReceita ? '+' : '-'} {formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  description: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
