import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/constants/categories';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useCreateGoal } from '@/hooks/useGoals';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { GoalKind, PaymentMethod } from '@/types/database.types';
import { showAlert } from '@/utils/alert';
import { parseCurrencyInput } from '@/utils/currency';

export default function NovaMetaScreen() {
  const styles = useThemedStyles(makeStyles);
  const [kind, setKind] = useState<GoalKind | null>(null);

  if (!kind) return <TypeChooser styles={styles} onPick={setKind} />;
  if (kind === 'gasto') return <GastoForm styles={styles} onBack={() => setKind(null)} />;
  return <CaixinhaForm styles={styles} onBack={() => setKind(null)} />;
}

type Styles = ReturnType<typeof makeStyles>;

function TypeChooser({ styles, onPick }: { styles: Styles; onPick: (kind: GoalKind) => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.chooserTitle}>Que tipo de meta você quer criar?</Text>

      <Pressable style={styles.typeCard} onPress={() => onPick('gasto')}>
        <View style={[styles.typeIcon, { backgroundColor: colors.danger }]}>
          <Feather name="trending-down" size={22} color="#fff" />
        </View>
        <View style={styles.typeCardText}>
          <Text style={styles.typeCardTitle}>Limite de gasto</Text>
          <Text style={styles.typeCardDesc}>
            Defina quanto quer gastar por mês. Pode valer para todas as despesas ou só
            para uma categoria, conta ou forma de pagamento.
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.typeCard} onPress={() => onPick('caixinha')}>
        <View style={[styles.typeIcon, { backgroundColor: colors.primary }]}>
          <Feather name="dollar-sign" size={22} color="#fff" />
        </View>
        <View style={styles.typeCardText}>
          <Text style={styles.typeCardTitle}>Caixinha</Text>
          <Text style={styles.typeCardDesc}>
            Guarde dinheiro para um objetivo (como uma caixinha do banco). Você registra
            depósitos e retiradas quando quiser.
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface ChipGroupProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  styles: Styles;
}

function ChipGroup({ title, options, selected, onToggle, styles }: ChipGroupProps) {
  if (options.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(option.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GastoForm({ styles, onBack }: { styles: Styles; onBack: () => void }) {
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const createGoal = useCreateGoal();

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const amount = parseCurrencyInput(amountText);
    if (!name.trim()) return setError('Dê um nome para a meta.');
    if (amount <= 0) return setError('Informe um limite maior que zero.');
    setError(null);
    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        kind: 'gasto',
        target_amount: amount,
        filter_category_ids: categoryIds,
        filter_account_ids: accountIds,
        filter_payment_methods: paymentMethods,
      });
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível criar a meta. Tente novamente.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackRow styles={styles} onBack={onBack} label="Limite de gasto" />

      <View style={styles.field}>
        <Text style={styles.label}>Nome da meta</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Limite do cartão"
          maxLength={60}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Limite mensal</Text>
        <TextInput
          style={styles.amountInput}
          value={amountText}
          onChangeText={setAmountText}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
        />
      </View>

      <Text style={styles.scopeHint}>
        Escopo (opcional): escolha o que entra nessa meta. Deixe tudo desmarcado para
        considerar todas as despesas do mês.
      </Text>

      <ChipGroup
        title="Categorias"
        options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        selected={categoryIds}
        onToggle={(id) => setCategoryIds((prev) => toggle(prev, id))}
        styles={styles}
      />
      <ChipGroup
        title="Contas"
        options={(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))}
        selected={accountIds}
        onToggle={(id) => setAccountIds((prev) => toggle(prev, id))}
        styles={styles}
      />
      <ChipGroup
        title="Formas de pagamento"
        options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
        selected={paymentMethods}
        onToggle={(m) => setPaymentMethods((prev) => toggle(prev, m as PaymentMethod))}
        styles={styles}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={styles.submitButton} onPress={handleSave} disabled={createGoal.isPending}>
        {createGoal.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Criar meta</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function CaixinhaForm({ styles, onBack }: { styles: Styles; onBack: () => void }) {
  const createGoal = useCreateGoal();
  const [name, setName] = useState('');
  const [targetText, setTargetText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return setError('Dê um nome para a caixinha.');
    setError(null);
    const target = parseCurrencyInput(targetText);
    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        kind: 'caixinha',
        target_amount: target > 0 ? target : null,
      });
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível criar a caixinha. Tente novamente.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackRow styles={styles} onBack={onBack} label="Caixinha" />

      <View style={styles.field}>
        <Text style={styles.label}>Nome da caixinha</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Viagem de fim de ano"
          maxLength={60}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Objetivo (opcional)</Text>
        <TextInput
          style={styles.amountInput}
          value={targetText}
          onChangeText={setTargetText}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
        />
        <Text style={styles.scopeHint}>
          Se definir um objetivo, aparece uma barra de progresso. Depois você registra os
          depósitos na tela da caixinha.
        </Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={styles.submitButton} onPress={handleSave} disabled={createGoal.isPending}>
        {createGoal.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Criar caixinha</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function BackRow({ styles, onBack, label }: { styles: Styles; onBack: () => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.backRow} onPress={onBack}>
      <Feather name="arrow-left" size={20} color={colors.primary} />
      <Text style={styles.backLabel}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    chooserTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    typeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeCardText: { flex: 1 },
    typeCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
    typeCardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    backLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    field: { marginBottom: Spacing.md },
    label: { fontSize: 13, color: colors.textMuted, marginBottom: Spacing.xs },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    amountInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    scopeHint: { fontSize: 12, color: colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.md, lineHeight: 17 },
    group: { marginBottom: Spacing.md },
    groupTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: Spacing.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textMuted },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    errorText: { color: colors.danger, fontSize: 13, marginBottom: Spacing.md },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
