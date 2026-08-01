import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { AccountPicker } from '@/components/AccountPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useCreateRecurringItem } from '@/hooks/useRecurringItems';
import { showAlert } from '@/utils/alert';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';
import type { PaymentMethod, TransactionType } from '@/types/database.types';

const schema = z
  .object({
    type: z.enum(['receita', 'despesa']),
    amountText: z.string().min(1, 'Informe o valor'),
    description: z.string().trim().min(1, 'Informe uma descrição').max(100),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    accountId: z.string().min(1, 'Selecione uma conta'),
    paymentMethod: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto']),
    dayOfMonth: z.number().int().min(1).max(31),
  })
  .refine((data) => parseCurrencyInput(data.amountText) > 0, {
    message: 'O valor deve ser maior que zero',
    path: ['amountText'],
  });

type FormValues = z.infer<typeof schema>;

export default function NovaRecorrenciaScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const createRecurring = useCreateRecurringItem();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'despesa',
      amountText: '',
      description: '',
      categoryId: '',
      accountId: '',
      paymentMethod: 'pix',
      dayOfMonth: 1,
    },
  });

  const type = watch('type');
  const dayOfMonth = watch('dayOfMonth');
  const amount = parseCurrencyInput(watch('amountText') || '0');

  async function onSubmit(values: FormValues) {
    try {
      await createRecurring.mutateAsync({
        description: values.description.trim(),
        amount: parseCurrencyInput(values.amountText),
        type: values.type,
        category_id: values.categoryId,
        account_id: values.accountId,
        payment_method: values.paymentMethod,
        day_of_month: values.dayOfMonth,
      });
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível criar a recorrência. Tente novamente.');
    }
  }

  function handleTypeChange(next: TransactionType) {
    setValue('type', next);
    setValue('categoryId', '');
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.hint}>
          A recorrência entra automaticamente todo mês a partir deste mês — ideal para
          salário e contas fixas como internet e aluguel.
        </Text>

        <View style={styles.typeToggle}>
          <Pressable
            style={[styles.typeButton, type === 'despesa' && styles.typeButtonDespesaActive]}
            onPress={() => handleTypeChange('despesa')}
          >
            <Text style={[styles.typeButtonText, type === 'despesa' && styles.typeButtonTextActive]}>
              Despesa
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, type === 'receita' && styles.typeButtonReceitaActive]}
            onPress={() => handleTypeChange('receita')}
          >
            <Text style={[styles.typeButtonText, type === 'receita' && styles.typeButtonTextActive]}>
              Receita
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Valor mensal</Text>
          <Controller
            control={control}
            name="amountText"
            render={({ field }) => (
              <TextInput
                style={[styles.amountInput, errors.amountText && styles.inputError]}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="R$ 0,00"
                keyboardType="decimal-pad"
              />
            )}
          />
          {errors.amountText && <Text style={styles.errorText}>{errors.amountText.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextInput
                style={[styles.input, errors.description && styles.inputError]}
                value={field.value}
                onChangeText={field.onChange}
                placeholder={type === 'receita' ? 'Ex: Salário' : 'Ex: Internet'}
                maxLength={100}
              />
            )}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dia do mês</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepButton}
              onPress={() => setValue('dayOfMonth', Math.max(1, dayOfMonth - 1))}
              disabled={dayOfMonth <= 1}
            >
              <Feather name="minus" size={18} color={dayOfMonth <= 1 ? colors.border : colors.primary} />
            </Pressable>
            <Text style={styles.stepValue}>Dia {dayOfMonth}</Text>
            <Pressable
              style={styles.stepButton}
              onPress={() => setValue('dayOfMonth', Math.min(31, dayOfMonth + 1))}
              disabled={dayOfMonth >= 31}
            >
              <Feather name="plus" size={18} color={dayOfMonth >= 31 ? colors.border : colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.stepHint}>
            Em meses mais curtos, cai no último dia do mês.
          </Text>
        </View>

        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategoryPicker
              type={type}
              value={field.value || null}
              onSelect={field.onChange}
              error={errors.categoryId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="accountId"
          render={({ field }) => (
            <AccountPicker
              value={field.value || null}
              onSelect={field.onChange}
              error={errors.accountId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <PaymentMethodPicker
              value={field.value}
              onSelect={(m: PaymentMethod) => setValue('paymentMethod', m)}
              error={errors.paymentMethod?.message}
            />
          )}
        />

        {amount > 0 && (
          <Text style={styles.preview}>
            {formatCurrency(amount)} todo dia {dayOfMonth}, a partir deste mês
          </Text>
        )}

        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Salvar recorrência</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeButtonDespesaActive: { backgroundColor: colors.danger },
  typeButtonReceitaActive: { backgroundColor: colors.success },
  typeButtonText: { fontWeight: '600', color: colors.textMuted },
  typeButtonTextActive: { color: '#fff' },
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
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  stepButton: { padding: Spacing.sm },
  stepValue: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 70, textAlign: 'center' },
  stepHint: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  preview: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginBottom: Spacing.md },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
