import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { AccountPicker } from '@/components/AccountPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { InstallmentInput } from '@/components/InstallmentInput';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { suggestCategoryName } from '@/constants/categorySuggestions';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useCategories } from '@/hooks/useCategories';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useCreatePurchase } from '@/hooks/useTransactions';
import { useCreateRecurringItem } from '@/hooks/useRecurringItems';
import { showAlert } from '@/utils/alert';
import { parseCurrencyInput } from '@/utils/currency';
import { toISODate } from '@/utils/date';
import type { PaymentMethod, TransactionType } from '@/types/database.types';

const schema = z
  .object({
    type: z.enum(['receita', 'despesa']),
    amountText: z.string().min(1, 'Informe o valor'),
    description: z.string().trim().min(1, 'Informe uma descrição').max(100),
    date: z.date(),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    accountId: z.string().min(1, 'Selecione uma conta'),
    paymentMethod: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto']),
    installments: z.number().int().min(1).max(24),
    isRecurring: z.boolean(),
    dayOfMonth: z.number().int().min(1, 'Informe um dia entre 1 e 31').max(31, 'Informe um dia entre 1 e 31'),
  })
  .refine((data) => parseCurrencyInput(data.amountText) > 0, {
    message: 'O valor deve ser maior que zero',
    path: ['amountText'],
  })
  .refine((data) => data.installments === 1 || data.paymentMethod === 'cartao_credito', {
    message: 'Parcelamento só está disponível para Cartão de Crédito',
    path: ['installments'],
  });

type FormValues = z.infer<typeof schema>;

export function TransactionForm() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const createPurchase = useCreatePurchase();
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
      date: new Date(),
      categoryId: '',
      accountId: '',
      paymentMethod: 'pix',
      installments: 1,
      isRecurring: false,
      dayOfMonth: new Date().getDate(),
    },
  });

  const type = watch('type');
  const paymentMethod = watch('paymentMethod');
  const installments = watch('installments');
  const amountText = watch('amountText');
  const amount = parseCurrencyInput(amountText || '0');
  const description = watch('description');
  const categoryId = watch('categoryId');
  const isRecurring = watch('isRecurring');

  const { data: categories } = useCategories(type);

  // Feature 5 — sugestão automática de categoria pela descrição. Só age quando
  // o campo Categoria ainda está vazio, então nunca sobrescreve uma escolha
  // manual (a pessoa pode trocar à vontade que a sugestão não volta por cima).
  useEffect(() => {
    if (categoryId || !categories) return;
    const suggested = suggestCategoryName(description);
    if (!suggested) return;
    const match = categories.find((c) => c.name === suggested);
    if (match) setValue('categoryId', match.id);
  }, [description, categoryId, categories, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      if (values.isRecurring) {
        await createRecurring.mutateAsync({
          description: values.description.trim(),
          amount: parseCurrencyInput(values.amountText),
          type: values.type,
          category_id: values.categoryId,
          account_id: values.accountId,
          payment_method: values.paymentMethod,
          day_of_month: values.dayOfMonth,
        });
      } else {
        await createPurchase.mutateAsync({
          p_description: values.description.trim(),
          p_total_amount: parseCurrencyInput(values.amountText),
          p_type: values.type,
          p_category_id: values.categoryId,
          p_account_id: values.accountId,
          p_payment_method: values.paymentMethod,
          p_purchase_date: toISODate(values.date),
          p_num_installments: values.paymentMethod === 'cartao_credito' ? values.installments : 1,
        });
      }
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível salvar a transação. Tente novamente.');
    }
  }

  function handleTypeChange(next: TransactionType) {
    setValue('type', next);
    setValue('categoryId', '');
  }

  function handlePaymentMethodChange(next: PaymentMethod) {
    setValue('paymentMethod', next);
    if (next !== 'cartao_credito') setValue('installments', 1);
  }

  function handleRecurringChange(next: boolean) {
    setValue('isRecurring', next);
    if (next) {
      // Padrão: o dia do mês segue o dia da data escolhida; recorrência é 1x/mês.
      setValue('dayOfMonth', watch('date').getDate());
      setValue('installments', 1);
    }
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.label}>Valor</Text>
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
              placeholder="Ex: Mercado do mês"
              maxLength={100}
            />
          )}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
      </View>

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <DateField label="Data" value={field.value} onChange={field.onChange} />
        )}
      />

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
            onSelect={handlePaymentMethodChange}
            error={errors.paymentMethod?.message}
          />
        )}
      />

      {paymentMethod === 'cartao_credito' && !isRecurring && (
        <View>
          <InstallmentInput
            value={installments}
            onChange={(n) => setValue('installments', n)}
            totalAmount={amount}
          />
          {errors.installments && <Text style={styles.errorText}>{errors.installments.message}</Text>}
        </View>
      )}

      <View style={styles.recurringRow}>
        <View style={styles.recurringTextWrap}>
          <Text style={styles.recurringLabel}>Repetir todo mês</Text>
          <Text style={styles.hint}>Lança esta transação automaticamente todo mês.</Text>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={handleRecurringChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {isRecurring && (
        <View style={styles.field}>
          <Text style={styles.label}>Dia do mês</Text>
          <Controller
            control={control}
            name="dayOfMonth"
            render={({ field }) => (
              <TextInput
                style={[styles.input, errors.dayOfMonth && styles.inputError]}
                value={field.value ? String(field.value) : ''}
                onChangeText={(text) => {
                  const digits = text.replace(/[^0-9]/g, '').slice(0, 2);
                  field.onChange(digits ? Math.min(31, parseInt(digits, 10)) : 0);
                }}
                placeholder="Ex: 5"
                keyboardType="number-pad"
                maxLength={2}
              />
            )}
          />
          {errors.dayOfMonth && <Text style={styles.errorText}>{errors.dayOfMonth.message}</Text>}
        </View>
      )}

      <Pressable
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isRecurring ? 'Salvar recorrência' : 'Salvar transação'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { padding: Spacing.lg },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
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
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  recurringTextWrap: { flex: 1 },
  recurringLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
