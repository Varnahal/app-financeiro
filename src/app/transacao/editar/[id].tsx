import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

import { AccountPicker } from '@/components/AccountPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { Colors, Spacing } from '@/constants/theme';
import { useTransaction, useUpdatePurchase } from '@/hooks/useTransactions';
import { showAlert } from '@/utils/alert';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';
import { dayjs, toISODate } from '@/utils/date';
import type { PaymentMethod, TransactionType } from '@/types/database.types';

export default function EditarTransacaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id);
  const updatePurchase = useUpdatePurchase();

  const [ready, setReady] = useState(false);
  const [type, setType] = useState<TransactionType>('despesa');
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [errors, setErrors] = useState<{ amount?: string; description?: string; category?: string; account?: string }>({});

  const isParcelado = (transaction?.installments_total ?? 1) > 1;
  const isRecorrente = !!transaction?.purchase?.recurring_item_id;

  // Preenche o formulário uma vez, quando a transação chega.
  if (!ready && transaction) {
    setType(transaction.type);
    setAmountText(
      String(transaction.purchase?.total_amount ?? transaction.amount).replace('.', ',')
    );
    setDescription(transaction.purchase?.description ?? transaction.description);
    setDate(dayjs(transaction.purchase?.purchase_date ?? transaction.due_date).toDate());
    setCategoryId(transaction.category?.id ?? '');
    setAccountId(transaction.account?.id ?? '');
    if (transaction.purchase?.payment_method) setPaymentMethod(transaction.purchase.payment_method);
    setReady(true);
  }

  if (isLoading || !transaction) {
    return (
      <View style={styles.center}>
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text style={styles.notFound}>Transação não encontrada.</Text>
        )}
      </View>
    );
  }

  async function handleSave() {
    const nextErrors: typeof errors = {};
    if (!isParcelado && parseCurrencyInput(amountText) <= 0) nextErrors.amount = 'Valor inválido';
    if (!description.trim()) nextErrors.description = 'Informe uma descrição';
    if (!categoryId) nextErrors.category = 'Selecione uma categoria';
    if (!accountId) nextErrors.account = 'Selecione uma conta';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updatePurchase.mutateAsync({
        p_purchase_id: transaction!.purchase_id,
        p_description: description.trim(),
        // Em parcelado o valor/data são ignorados pela função no banco; mandamos
        // os valores atuais só para satisfazer a assinatura.
        p_total_amount: isParcelado
          ? transaction!.purchase?.total_amount ?? transaction!.amount
          : parseCurrencyInput(amountText),
        p_type: type,
        p_category_id: categoryId,
        p_account_id: accountId,
        p_payment_method: paymentMethod,
        p_purchase_date: isParcelado
          ? transaction!.purchase?.purchase_date ?? transaction!.due_date
          : toISODate(date),
      });
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    }
  }

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategoryId('');
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {isRecorrente && (
          <View style={styles.noteBox}>
            <Feather name="repeat" size={16} color={Colors.primary} />
            <Text style={styles.noteText}>
              Esta transação veio de uma recorrência. A edição muda só este lançamento, não a
              recorrência.
            </Text>
          </View>
        )}

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
          {isParcelado ? (
            <View style={styles.lockedField}>
              <Text style={styles.lockedValue}>
                {formatCurrency(transaction.purchase?.total_amount ?? transaction.amount)}
              </Text>
              <Feather name="lock" size={16} color={Colors.textMuted} />
            </View>
          ) : (
            <TextInput
              style={[styles.amountInput, errors.amount && styles.inputError]}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="R$ 0,00"
              keyboardType="decimal-pad"
            />
          )}
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, errors.description && styles.inputError]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Mercado do mês"
            maxLength={100}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {isParcelado ? (
          <View style={styles.field}>
            <Text style={styles.label}>Data</Text>
            <View style={styles.lockedField}>
              <Text style={styles.lockedValue}>{dayjs(transaction.due_date).format('DD/MM/YYYY')}</Text>
              <Feather name="lock" size={16} color={Colors.textMuted} />
            </View>
          </View>
        ) : (
          <DateField label="Data" value={date} onChange={setDate} />
        )}

        <CategoryPicker
          type={type}
          value={categoryId || null}
          onSelect={setCategoryId}
          error={errors.category}
        />
        <AccountPicker value={accountId || null} onSelect={setAccountId} error={errors.account} />
        <PaymentMethodPicker value={paymentMethod} onSelect={setPaymentMethod} />

        {isParcelado && (
          <Text style={styles.parceladoNote}>
            Esta é uma compra parcelada ({transaction.installments_total}x). Valor, data e número
            de parcelas não podem ser alterados aqui — para mudar isso, exclua a compra e crie de
            novo. As alterações acima valem para todas as parcelas.
          </Text>
        )}

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={updatePurchase.isPending}>
          {updatePurchase.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar alterações</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFound: { color: Colors.textMuted, fontSize: 15 },
  noteBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: '#EAF4FE',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noteText: { flex: 1, color: Colors.text, fontSize: 13 },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
  lockedField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  lockedValue: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  parceladoNote: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
