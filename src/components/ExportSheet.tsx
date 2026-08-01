import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { MonthSelector } from '@/components/MonthSelector';
import { Spacing, WebMaxWidth, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { fetchTransactionsInRange } from '@/hooks/useTransactions';
import { showAlert } from '@/utils/alert';
import { dayjs, monthRange, toISODate } from '@/utils/date';
import { exportTransactionsToExcel } from '@/utils/exportExcel';

type ExportMode = 'mes' | 'periodo';

interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Mês inicial sugerido (o mês que está aberto na tela de transações). */
  initialMonth: Date;
}

export function ExportSheet({ visible, onClose, initialMonth }: ExportSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState<ExportMode>('mes');
  const [month, setMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState(() => dayjs().startOf('month').toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  // Re-sincroniza o mês com o da tela sempre que o sheet abre.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setMonth(initialMonth);
  }

  async function handleExport() {
    let range: { start: string; end: string };
    let fileName: string;

    if (mode === 'mes') {
      range = monthRange(month);
      fileName = `buffa-finance_${dayjs(month).format('YYYY-MM')}.xlsx`;
    } else {
      if (dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
        showAlert('Ops', 'A data final deve ser depois da data inicial.');
        return;
      }
      range = { start: toISODate(startDate), end: toISODate(endDate) };
      fileName = `buffa-finance_${range.start}_a_${range.end}.xlsx`;
    }

    setExporting(true);
    try {
      const transactions = await fetchTransactionsInRange(range);
      if (transactions.length === 0) {
        showAlert('Nada para exportar', 'Não há transações no período selecionado.');
        return;
      }
      await exportTransactionsToExcel(transactions, fileName);
      onClose();
    } catch {
      showAlert('Erro', 'Não foi possível exportar. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={styles.backdropTint} />
        </Pressable>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Exportar para Excel</Text>

          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeButton, mode === 'mes' && styles.modeButtonActive]}
              onPress={() => setMode('mes')}
            >
              <Text style={[styles.modeButtonText, mode === 'mes' && styles.modeButtonTextActive]}>
                Mês específico
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, mode === 'periodo' && styles.modeButtonActive]}
              onPress={() => setMode('periodo')}
            >
              <Text
                style={[styles.modeButtonText, mode === 'periodo' && styles.modeButtonTextActive]}
              >
                Período
              </Text>
            </Pressable>
          </View>

          {mode === 'mes' ? (
            <View style={styles.monthWrapper}>
              <MonthSelector month={month} onChange={setMonth} />
            </View>
          ) : (
            <View>
              <DateField label="Data inicial" value={startDate} onChange={setStartDate} />
              <DateField label="Data final" value={endDate} onChange={setEndDate} />
            </View>
          )}

          <Text style={styles.hint}>
            A planilha terá uma aba com todas as transações e uma aba de resumo (totais e
            despesas por categoria).
          </Text>

          <Pressable style={styles.exportButton} onPress={handleExport} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.exportButtonText}>Exportar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  // No web mantém o sheet dentro da coluna do app (o Modal renderiza na janela
  // toda). No celular (<maxWidth) é no-op, então o APK não muda.
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    width: '100%',
    maxWidth: WebMaxWidth,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, color: colors.text },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primary },
  modeButtonText: { fontWeight: '600', color: colors.textMuted, fontSize: 13 },
  modeButtonTextActive: { color: '#fff' },
  monthWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: Spacing.xs, marginBottom: Spacing.md },
  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
