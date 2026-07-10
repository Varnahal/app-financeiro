import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryIcon, PAYMENT_METHOD_LABELS } from '@/constants/categories';
import { Colors, Spacing } from '@/constants/theme';
import { useDeletePurchase, useTransaction } from '@/hooks/useTransactions';
import { showAlert, showConfirm } from '@/utils/alert';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export default function TransacaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id);
  const deletePurchase = useDeletePurchase();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Transação não encontrada.</Text>
      </View>
    );
  }

  const isReceita = transaction.type === 'receita';
  const isParcelado = transaction.installments_total > 1;

  async function handleDelete() {
    const message = isParcelado
      ? `Isso vai excluir a compra inteira, incluindo todas as ${transaction!.installments_total} parcelas. Deseja continuar?`
      : 'Deseja realmente excluir esta transação?';

    const confirmed = await showConfirm('Excluir transação', message, {
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deletePurchase.mutateAsync(transaction!.purchase_id);
      router.back();
    } catch {
      showAlert('Erro', 'Não foi possível excluir. Tente novamente.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: isReceita ? '#E7F7EC' : '#FDEBEB' }]}>
        <Feather
          name={getCategoryIcon(transaction.category?.icon)}
          size={28}
          color={isReceita ? Colors.success : Colors.danger}
        />
      </View>

      <Text style={styles.description}>{transaction.description}</Text>
      <Text style={[styles.amount, { color: isReceita ? Colors.success : Colors.text }]}>
        {isReceita ? '+' : '-'} {formatCurrency(transaction.amount)}
      </Text>
      {isParcelado && (
        <Text style={styles.installmentBadge}>
          Parcela {transaction.installment_number} de {transaction.installments_total}
        </Text>
      )}

      <View style={styles.details}>
        <DetailRow label="Data" value={formatDate(transaction.due_date)} />
        <DetailRow label="Categoria" value={transaction.category?.name ?? 'Sem categoria'} />
        <DetailRow label="Conta" value={transaction.account?.name ?? '—'} />
        {transaction.purchase && (
          <DetailRow
            label="Forma de pagamento"
            value={PAYMENT_METHOD_LABELS[transaction.purchase.payment_method]}
          />
        )}
      </View>

      <Pressable
        style={styles.editButton}
        onPress={() => router.push(`/transacao/editar/${transaction.id}`)}
      >
        <Feather name="edit-2" size={18} color="#fff" />
        <Text style={styles.editButtonText}>Editar</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deletePurchase.isPending}>
        {deletePurchase.isPending ? (
          <ActivityIndicator color={Colors.danger} />
        ) : (
          <>
            <Feather name="trash-2" size={18} color={Colors.danger} />
            <Text style={styles.deleteButtonText}>
              {isParcelado ? 'Excluir compra inteira' : 'Excluir transação'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFound: { color: Colors.textMuted, fontSize: 15 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  description: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  amount: { fontSize: 32, fontWeight: '800', marginTop: Spacing.xs },
  installmentBadge: { color: Colors.textMuted, marginTop: Spacing.xs, fontSize: 13 },
  details: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  detailLabel: { color: Colors.textMuted, fontSize: 14 },
  detailValue: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  editButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
  },
  deleteButtonText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});
