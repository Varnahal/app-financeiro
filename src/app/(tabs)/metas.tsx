import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar, spendingColor } from '@/components/ProgressBar';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useGoalBalances, useGoals } from '@/hooks/useGoals';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/currency';
import { monthRange } from '@/utils/date';
import { describeGoalScope, progressRatio, spentForGoal } from '@/utils/goals';

export default function MetasScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();

  const range = useMemo(() => monthRange(new Date()), []);
  const { data: goals, isLoading } = useGoals();
  const { data: transactions } = useTransactions(range);
  const { data: balances } = useGoalBalances();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const categoryNames = useMemo(
    () => Object.fromEntries((categories ?? []).map((c) => [c.id, c.name])),
    [categories]
  );
  const accountNames = useMemo(
    () => Object.fromEntries((accounts ?? []).map((a) => [a.id, a.name])),
    [accounts]
  );

  const gastoGoals = (goals ?? []).filter((g) => g.kind === 'gasto');
  const caixinhaGoals = (goals ?? []).filter((g) => g.kind === 'caixinha');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Metas</Text>
        <Pressable style={styles.newButton} onPress={() => router.push('/meta/nova')}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.newButtonText}>Nova meta</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xl }} />
      ) : (goals ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Feather name="target" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhuma meta ainda</Text>
          <Text style={styles.emptyText}>
            Crie uma meta de gasto para não passar do limite do mês, ou uma caixinha para
            guardar dinheiro para um objetivo.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {gastoGoals.length > 0 && (
            <Text style={styles.sectionLabel}>Limites de gasto (mês atual)</Text>
          )}
          {gastoGoals.map((goal) => {
            const spent = spentForGoal(transactions ?? [], goal);
            const ratio = progressRatio(spent, goal.target_amount);
            const remaining = (goal.target_amount ?? 0) - spent;
            return (
              <Pressable
                key={goal.id}
                style={styles.card}
                onPress={() => router.push(`/meta/${goal.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{goal.name}</Text>
                  <Text style={[styles.cardPercent, { color: spendingColor(ratio, colors) }]}>
                    {Math.round(ratio * 100)}%
                  </Text>
                </View>
                <Text style={styles.cardScope}>
                  {describeGoalScope(goal, categoryNames, accountNames)}
                </Text>
                <ProgressBar ratio={ratio} color={spendingColor(ratio, colors)} />
                <Text style={styles.cardFooter}>
                  {formatCurrency(spent)} de {formatCurrency(goal.target_amount ?? 0)}
                  {remaining >= 0
                    ? ` · faltam ${formatCurrency(remaining)}`
                    : ` · ${formatCurrency(-remaining)} acima`}
                </Text>
              </Pressable>
            );
          })}

          {caixinhaGoals.length > 0 && <Text style={styles.sectionLabel}>Caixinhas</Text>}
          {caixinhaGoals.map((goal) => {
            const balance = balances?.[goal.id] ?? 0;
            const ratio = progressRatio(balance, goal.target_amount);
            return (
              <Pressable
                key={goal.id}
                style={styles.card}
                onPress={() => router.push(`/meta/${goal.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{goal.name}</Text>
                  {goal.target_amount ? (
                    <Text style={[styles.cardPercent, { color: colors.primary }]}>
                      {Math.round(ratio * 100)}%
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.cardBalance}>{formatCurrency(balance)}</Text>
                {goal.target_amount ? (
                  <>
                    <ProgressBar ratio={ratio} color={colors.primary} />
                    <Text style={styles.cardFooter}>
                      Objetivo: {formatCurrency(goal.target_amount)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.cardFooter}>Sem objetivo definido</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    screenTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: 999,
    },
    newButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginTop: Spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
    cardPercent: { fontSize: 14, fontWeight: '700' },
    cardScope: { fontSize: 12, color: colors.textMuted, marginBottom: Spacing.xs },
    cardBalance: { fontSize: 22, fontWeight: '700', color: colors.text, marginVertical: 2 },
    cardFooter: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    empty: {
      alignItems: 'center',
      marginTop: Spacing.xl * 2,
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 14 },
  });
