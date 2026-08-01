import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export { dayjs };

export function formatDate(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}

export function formatDayHeader(date: string | Date): string {
  return dayjs(date).format('dddd, D [de] MMMM');
}

export function formatMonthLabel(date: string | Date): string {
  return dayjs(date).format('MMM/YY');
}

export function toISODate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/** Início e fim (inclusive) do mês da data informada, no formato YYYY-MM-DD. */
export function monthRange(date: Date = new Date()): { start: string; end: string } {
  const d = dayjs(date);
  return {
    start: d.startOf('month').format('YYYY-MM-DD'),
    end: d.endOf('month').format('YYYY-MM-DD'),
  };
}

/** Últimos `count` meses (mais antigo primeiro), cada um como YYYY-MM. */
export function lastMonths(count: number, from: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(dayjs(from).subtract(i, 'month').format('YYYY-MM'));
  }
  return months;
}

/**
 * Todos os meses entre `start` e `end` (inclusive), mais antigo primeiro, como
 * YYYY-MM. Ordem tolerante (troca se start > end) e limitada a `maxCount` meses
 * para manter o gráfico legível e a consulta acotada.
 */
export function monthsBetween(start: Date, end: Date, maxCount = 24): string[] {
  let a = dayjs(start).startOf('month');
  let b = dayjs(end).startOf('month');
  if (a.isAfter(b)) [a, b] = [b, a];
  const months: string[] = [];
  let cursor = a;
  while (!cursor.isAfter(b) && months.length < maxCount) {
    months.push(cursor.format('YYYY-MM'));
    cursor = cursor.add(1, 'month');
  }
  return months;
}
