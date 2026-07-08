import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { buildExportData } from './exportRows';
import type { TransactionWithRelations } from '@/types/database.types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function buildWorkbook(transactions: TransactionWithRelations[]): XLSX.WorkBook {
  const { transactionRows, summaryRows } = buildExportData(transactions);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(transactionRows), 'Transações');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Resumo');
  return workbook;
}

/** Gera o .xlsx e abre a folha de compartilhar do Android/iOS. */
export async function exportTransactionsToExcel(
  transactions: TransactionWithRelations[],
  fileName: string
): Promise<void> {
  const workbook = buildWorkbook(transactions);
  const buffer: ArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.write(new Uint8Array(buffer));

  await Sharing.shareAsync(file.uri, {
    mimeType: XLSX_MIME,
    dialogTitle: 'Exportar transações',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}
