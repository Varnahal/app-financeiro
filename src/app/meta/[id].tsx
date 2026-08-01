import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProgressBar, spendingColor } from '@/components/ProgressBar';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import {
  useAddContribution,
  useDeleteGoal,
  useGoal,
  useGoalContributions,
} from '@/hooks/useGoals';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { showAlert, showConfirm } from '@/utils/alert';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';
import { formatDate, monthRange } from '@/utils/date';
import { describeGoalScope, progressRatio, spentForGoal } from '@/utils/goals';

export default function MetaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(makeStyles);
  const { data: goal, isLoading } = useGoal(id);
  const deleteGoal = useDeleteGoal();

  async function handleDelete() {
    if (!goal) return;
    const ok = await showConfirm(
      'Excluir meta',
      `Tem certeza que deseja excluir "${goal.name}"?`,
      { confirmText: 'Excluir', destructive: true }
    );
    if (!ok) return;
    try {
      await deleteGoal.mutateAsync(goal.id);
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível excluir a meta.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.loading}>
        <Text style={styles.mutedText}>Meta não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {goal.kind === 'gasto' ? (
        <GastoDetail goal={goal} styles={styles} />
      ) : (
        <CaixinhaDetail goal={goal} styles={styles} />
      )}

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Feather name="trash-2" size={18} color="#fff" />
        <Text style={styles.deleteButtonText}>Excluir meta</Text>
      </Pressable>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof makeStyles>;
type GoalRow = NonNullable<ReturnType<typeof useGoal>['data']>;

function GastoDetail({ goal, styles }: { goal: GoalRow; styles: Styles }) {
  const { colors } = useTheme();
  const range = useMemo(() => monthRange(new Date()), []);
  const { data: transactions } = useTransactions(range);
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

  const spent = spentForGoal(transactions ?? [], goal);
  const ratio = progressRatio(spent, goal.target_amount);
  const remaining = (goal.target_amount ?? 0) - spent;

  return (
    <View style={styles.section}>
      <Text style={styles.goalName}>{goal.name}</Text>
      <Text style={styles.scope}>{describeGoalScope(goal, categoryNames, accountNames)}</Text>

      <Text style={[styles.bigValue, { color: spendingColor(ratio, colors) }]}>
        {formatCurrency(spent)}
      </Text>
      <Text style={styles.mutedText}>
        de {formatCurrency(goal.target_amount ?? 0)} neste mês
      </Text>

      <View style={styles.progressWrap}>
        <ProgressBar ratio={ratio} color={spendingColor(ratio, colors)} />
      </View>

      <Text style={[styles.statusText, { color: spendingColor(ratio, colors) }]}>
        {remaining >= 0
          ? `Você ainda pode gastar ${formatCurrency(remaining)} (${Math.round(ratio * 100)}%)`
          : `Você passou ${formatCurrency(-remaining)} do limite`}
      </Text>
    </View>
  );
}

function CaixinhaDetail({ goal, styles }: { goal: GoalRow; styles: Styles }) {
  const { colors } = useTheme();
  const { data: contributions, isLoading } = useGoalContributions(goal.id);
  const addContribution = useAddContribution();
  const [amountText, setAmountText] = useState('');

  const balance = useMemo(
    () => (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0),
    [contributions]
  );
  const ratio = progressRatio(balance, goal.target_amount);

  async function handleMove(direction: 1 | -1) {
    const value = parseCurrencyInput(amountText);
    if (value <= 0) {
      showAlert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }
    if (direction === -1 && value > balance) {
      showAlert('Saldo insuficiente', 'Você não pode retirar mais do que tem na caixinha.');
      return;
    }
    try {
      await addContribution.mutateAsync({ goalId: goal.id, amount: value * direction });
      setAmountText('');
    } catch {
      showAlert('Erro', 'Não foi possível registrar a movimentação.');
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.goalName}>{goal.name}</Text>
      <Text style={styles.bigValue}>{formatCurrency(balance)}</Text>

      {goal.target_amount ? (
        <>
          <Text style={styles.mutedText}>
            de {formatCurrency(goal.target_amount)} ({Math.round(ratio * 100)}%)
          </Text>
          <View style={styles.progressWrap}>
            <ProgressBar ratio={ratio} color={colors.primary} />
          </View>
        </>
      ) : (
        <Text style={styles.mutedText}>Sem objetivo definido</Text>
      )}

      <View style={styles.moveBox}>
        <TextInput
          style={styles.moveInput}
          value={amountText}
          onChangeText={setAmountText}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
        />
        <View style={styles.moveButtons}>
          <Pressable
            style={[styles.moveButton, { backgroundColor: colors.success }]}
            onPress={() => handleMove(1)}
            disabled={addContribution.isPending}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.moveButtonText}>Depositar</Text>
          </Pressable>
          <Pressable
            style={[styles.moveButton, { backgroundColor: colors.danger }]}
            onPress={() => handleMove(-1)}
            disabled={addContribution.isPending}
          >
            <Feather name="minus" size={16} color="#fff" />
            <Text style={styles.moveButtonText}>Retirar</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.historyTitle}>Movimentações</Text>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Spacing.md }} />
      ) : (contributions ?? []).length === 0 ? (
        <Text style={styles.mutedText}>Nenhuma movimentação ainda.</Text>
      ) : (
        (contributions ?? []).map((c) => {
          const deposit = Number(c.amount) >= 0;
          return (
            <View key={c.id} style={styles.historyRow}>
              <View style={styles.historyIcon}>
                <Feather
                  name={deposit ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={20}
                  color={deposit ? colors.success : colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyLabel}>{deposit ? 'Depósito' : 'Retirada'}</Text>
                <Text style={styles.historyDate}>{formatDate(c.date)}</Text>
              </View>
              <Text
                style={[styles.historyValue, { color: deposit ? colors.success : colors.danger }]}
              >
                {deposit ? '+' : '−'}
                {formatCurrency(Math.abs(Number(c.amount)))}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    section: { marginBottom: Spacing.lg },
    goalName: { fontSize: 22, fontWeight: '700', color: colors.text },
    scope: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: Spacing.md },
    bigValue: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: Spacing.md },
    mutedText: { fontSize: 14, color: colors.textMuted },
    progressWrap: { marginTop: Spacing.md },
    statusText: { fontSize: 14, fontWeight: '600', marginTop: Spacing.sm },
    moveBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: Spacing.md,
      marginTop: Spacing.lg,
      gap: Spacing.md,
    },
    moveInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    moveButtons: { flexDirection: 'row', gap: Spacing.sm },
    moveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 12,
      paddingVertical: 12,
    },
    moveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    historyTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    historyIcon: { width: 28, alignItems: 'center' },
    historyLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
    historyDate: { fontSize: 12, color: colors.textMuted },
    historyValue: { fontSize: 15, fontWeight: '700' },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: Spacing.md,
    },
    deleteButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
