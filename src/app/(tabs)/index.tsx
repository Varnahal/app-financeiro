import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterButton, FilterSheet } from '@/components/FilterSheet';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionListItem } from '@/components/TransactionListItem';
import { Colors, Spacing } from '@/constants/theme';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/currency';
import { formatDayHeader, monthRange } from '@/utils/date';
import { applyTransactionFilters, countActiveFilters, EMPTY_FILTERS } from '@/utils/filters';
import type { TransactionWithRelations } from '@/types/database.types';

interface Section {
  title: string;
  total: number;
  data: TransactionWithRelations[];
}

function groupByDay(transactions: TransactionWithRelations[]): Section[] {
  const byDay = new Map<string, TransactionWithRelations[]>();
  for (const tx of transactions) {
    const key = tx.due_date;
    const list = byDay.get(key) ?? [];
    list.push(tx);
    byDay.set(key, list);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, data]) => ({
      title: formatDayHeader(date),
      total: data.reduce((sum, tx) => sum + (tx.type === 'receita' ? tx.amount : -tx.amount), 0),
      data,
    }));
}

export default function TransacoesScreen() {
  const [month, setMonth] = useState(new Date());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const range = useMemo(() => monthRange(month), [month]);
  const { data: transactions, isLoading } = useTransactions(range);

  const filtered = useMemo(
    () => applyTransactionFilters(transactions ?? [], filters),
    [transactions, filters]
  );

  const sections = useMemo(() => groupByDay(filtered), [filtered]);

  const monthTotal = useMemo(
    () => filtered.reduce((sum, tx) => sum + (tx.type === 'receita' ? tx.amount : -tx.amount), 0),
    [filtered]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <MonthSelector month={month} onChange={setMonth} />
        </View>
        <FilterButton
          activeCount={countActiveFilters(filters)}
          onPress={() => setFilterOpen(true)}
        />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Saldo do mês</Text>
        <Text
          style={[styles.summaryValue, { color: monthTotal >= 0 ? Colors.success : Colors.danger }]}
        >
          {formatCurrency(monthTotal)}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xl }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionTotal}>{formatCurrency(section.total)}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <TransactionListItem
                transaction={item}
                onPress={() => router.push(`/transacao/${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {countActiveFilters(filters) > 0
                  ? 'Nenhuma transação encontrada com os filtros atuais.'
                  : 'Nenhuma transação neste mês. Toque no + para adicionar a primeira.'}
              </Text>
            </View>
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/transacao/nova')}>
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  summary: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryLabel: { fontSize: 13, color: Colors.textMuted },
  summaryValue: { fontSize: 28, fontWeight: '700', marginTop: 2 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textTransform: 'capitalize' },
  sectionTotal: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  itemWrapper: { marginBottom: Spacing.sm },
  empty: { alignItems: 'center', marginTop: Spacing.xl * 2, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyText: { color: Colors.textMuted, textAlign: 'center', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
