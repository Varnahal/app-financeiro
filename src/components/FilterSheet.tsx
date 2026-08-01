import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/constants/categories';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { EMPTY_FILTERS, type TransactionFilters } from '@/utils/filters';

interface FilterButtonProps {
  activeCount: number;
  onPress: () => void;
}

export function FilterButton({ activeCount, onPress }: FilterButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable style={styles.filterButton} onPress={onPress}>
      <Feather name="sliders" size={20} color={colors.text} />
      {activeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface ChipGroupProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

function ChipGroup({ title, options, selected, onToggle }: ChipGroupProps) {
  const styles = useThemedStyles(makeStyles);
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
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
}

export function FilterSheet({ visible, onClose, filters, onApply }: FilterSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const [draft, setDraft] = useState<TransactionFilters>(filters);

  // Re-sincroniza o rascunho com os filtros aplicados sempre que o sheet abre
  // (padrão de estado derivado durante o render, sem useEffect).
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setDraft(filters);
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={styles.backdropTint} />
        </Pressable>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Filtros</Text>

          <ScrollView style={styles.scroll}>
            <ChipGroup
              title="Categorias"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
              selected={draft.categoryIds}
              onToggle={(id) => setDraft((d) => ({ ...d, categoryIds: toggle(d.categoryIds, id) }))}
            />
            <ChipGroup
              title="Contas"
              options={(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))}
              selected={draft.accountIds}
              onToggle={(id) => setDraft((d) => ({ ...d, accountIds: toggle(d.accountIds, id) }))}
            />
            <ChipGroup
              title="Formas de pagamento"
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
              selected={draft.paymentMethods}
              onToggle={(m) =>
                setDraft((d) => ({
                  ...d,
                  paymentMethods: toggle(d.paymentMethods, m) as TransactionFilters['paymentMethods'],
                }))
              }
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.clearButton} onPress={() => setDraft(EMPTY_FILTERS)}>
              <Text style={styles.clearButtonText}>Limpar</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  filterButton: {
    padding: Spacing.sm,
    borderRadius: 10,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, color: colors.text },
  scroll: { maxHeight: 420 },
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: { color: colors.text, fontWeight: '600' },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: { color: '#fff', fontWeight: '600' },
});
