import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import {
  useDeactivateRecurring,
  useRecurringItems,
  useUpdateRecurringAmount,
} from '@/hooks/useRecurringItems';
import { showAlert, showConfirm } from '@/utils/alert';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';
import type { RecurringItem } from '@/types/database.types';

function RecurringRow({ item, onEditAmount }: { item: RecurringItem; onEditAmount: () => void }) {
  const deactivate = useDeactivateRecurring();
  const isReceita = item.type === 'receita';

  async function handleDeactivate() {
    const confirmed = await showConfirm(
      'Encerrar recorrência',
      `"${item.description}" vai parar de ser lançada nos próximos meses. Os lançamentos já feitos continuam no histórico. Deseja encerrar?`,
      { confirmText: 'Encerrar', destructive: true }
    );
    if (!confirmed) return;
    try {
      await deactivate.mutateAsync(item.id);
    } catch {
      showAlert('Erro', 'Não foi possível encerrar. Tente novamente.');
    }
  }

  return (
    <View style={[styles.row, !item.active && styles.rowInactive]}>
      <View style={[styles.icon, { backgroundColor: isReceita ? '#E7F7EC' : '#FDEBEB' }]}>
        <Feather
          name="repeat"
          size={18}
          color={isReceita ? Colors.success : Colors.danger}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.meta}>
          {item.active ? `Todo dia ${item.day_of_month}` : 'Encerrada'}
          {' · '}
          {isReceita ? 'Receita' : 'Despesa'}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={[styles.amount, { color: isReceita ? Colors.success : Colors.text }]}>
          {formatCurrency(item.amount)}
        </Text>
        {item.active && (
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={onEditAmount}>
              <Feather name="edit-2" size={16} color={Colors.primary} />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleDeactivate}>
              <Feather name="x-circle" size={16} color={Colors.danger} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function RecorrentesScreen() {
  const { data: items, isLoading } = useRecurringItems();
  const updateAmount = useUpdateRecurringAmount();

  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const [amountText, setAmountText] = useState('');

  function openEdit(item: RecurringItem) {
    setEditing(item);
    setAmountText(String(item.amount).replace('.', ','));
  }

  async function handleSaveAmount() {
    if (!editing) return;
    const amount = parseCurrencyInput(amountText);
    if (amount <= 0) {
      showAlert('Ops', 'Informe um valor maior que zero.');
      return;
    }
    try {
      await updateAmount.mutateAsync({ itemId: editing.id, amount });
      setEditing(null);
    } catch {
      showAlert('Erro', 'Não foi possível alterar o valor. Tente novamente.');
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RecurringRow item={item} onEditAmount={() => openEdit(item)} />
        )}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Salário e contas fixas entram sozinhos todo mês. Ao alterar um valor, os meses
            passados são preservados — só o mês atual e os próximos mudam.
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={styles.empty}>
              <Feather name="repeat" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                Nenhuma recorrência ainda. Adicione seu salário ou uma conta fixa (ex:
                internet) abaixo.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <Pressable style={styles.addButton} onPress={() => router.push('/recorrente/nova')}>
            <Feather name="plus" size={18} color={Colors.primary} />
            <Text style={styles.addButtonText}>Nova recorrência</Text>
          </Pressable>
        }
      />

      <Modal
        visible={!!editing}
        animationType="slide"
        transparent
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditing(null)}>
            <View style={styles.backdropTint} />
          </Pressable>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Alterar valor — {editing?.description}</Text>
            <Text style={styles.sheetHint}>
              O novo valor vale deste mês em diante. Os meses anteriores não mudam.
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="R$ 0,00"
              keyboardType="decimal-pad"
              autoFocus
            />
            <Pressable
              style={styles.saveButton}
              onPress={handleSaveAmount}
              disabled={updateAmount.isPending}
            >
              {updateAmount.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar novo valor</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.lg },
  hint: { color: Colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  rowInactive: { opacity: 0.5 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  description: { fontSize: 15, fontWeight: '600', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: Spacing.xs },
  amount: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { padding: 4 },
  empty: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: { color: Colors.textMuted, textAlign: 'center', fontSize: 14 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: Spacing.md,
  },
  addButtonText: { color: Colors.primary, fontWeight: '600' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sheetHint: { color: Colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: Spacing.md },
  sheetInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700' },
});
