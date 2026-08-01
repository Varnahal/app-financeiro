import { formatCompactCurrency } from '@/utils/currency';
import { monthsBetween } from '@/utils/date';

describe('formatCompactCurrency', () => {
  it('abrevia milhares e milhões', () => {
    expect(formatCompactCurrency(1234)).toBe('R$ 1,2k');
    expect(formatCompactCurrency(1000)).toBe('R$ 1k');
    expect(formatCompactCurrency(1500000)).toBe('R$ 1,5M');
  });

  it('mantém valores pequenos inteiros', () => {
    expect(formatCompactCurrency(90)).toBe('R$ 90');
    expect(formatCompactCurrency(0)).toBe('R$ 0');
    expect(formatCompactCurrency(999)).toBe('R$ 999');
  });

  it('preserva o sinal', () => {
    expect(formatCompactCurrency(-2500)).toBe('-R$ 2,5k');
  });
});

describe('monthsBetween', () => {
  it('lista os meses inclusivos, mais antigo primeiro', () => {
    const start = new Date(2026, 0, 15); // Jan/2026
    const end = new Date(2026, 3, 2); // Abr/2026
    expect(monthsBetween(start, end)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
  });

  it('tolera start depois de end (troca a ordem)', () => {
    const start = new Date(2026, 3, 1);
    const end = new Date(2026, 1, 1);
    expect(monthsBetween(start, end)).toEqual(['2026-02', '2026-03', '2026-04']);
  });

  it('limita a quantidade de meses', () => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2030, 0, 1);
    expect(monthsBetween(start, end, 6)).toHaveLength(6);
  });
});
