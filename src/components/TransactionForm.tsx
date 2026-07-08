import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { AccountPicker } from '@/components/AccountPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { InstallmentInput } from '@/components/InstallmentInput';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { Colors, Spacing } from '@/constants/theme';
import { useCreatePurchase } from '@/hooks/useTransactions';
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
  const createPurchase = useCreatePurchase();

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
    },
  });

  const type = watch('type');
  const paymentMethod = watch('paymentMethod');
  const installments = watch('installments');
  const amountText = watch('amountText');
  const amount = parseCurrencyInput(amountText || '0');

  async function onSubmit(values: FormValues) {
    try {
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

      {paymentMethod === 'cartao_credito' && (
        <View>
          <InstallmentInput
            value={installments}
            onChange={(n) => setValue('installments', n)}
            totalAmount={amount}
          />
          {errors.installments && <Text style={styles.errorText}>{errors.installments.message}</Text>}
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
          <Text style={styles.submitButtonText}>Salvar transação</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  typeButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeButtonDespesaActive: { backgroundColor: Colors.danger },
  typeButtonReceitaActive: { backgroundColor: Colors.success },
  typeButtonText: { fontWeight: '600', color: Colors.textMuted },
  typeButtonTextActive: { color: '#fff' },
  field: { marginBottom: Spacing.md },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  amountInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
