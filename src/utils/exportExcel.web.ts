import { buildExportData } from './exportRows';
import type { TransactionWithRelations } from '@/types/database.types';

/** No navegador, XLSX.writeFile dispara o download direto do arquivo. */
export async function exportTransactionsToExcel(
  transactions: TransactionWithRelations[],
  fileName: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const { transactionRows, summaryRows } = buildExportData(transactions);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(transactionRows), 'Transações');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Resumo');
  XLSX.writeFile(workbook, fileName);
}
