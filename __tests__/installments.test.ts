import { splitPurchaseIntoInstallments } from '@/utils/installments';

describe('splitPurchaseIntoInstallments', () => {
  it('divide igualmente quando o valor é exato', () => {
    const result = splitPurchaseIntoInstallments(300, 3, '2026-03-10');
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.amount)).toEqual([100, 100, 100]);
    expect(result.map((i) => i.dueDate)).toEqual(['2026-03-10', '2026-04-10', '2026-05-10']);
  });

  it('joga o resto do arredondamento na última parcela e soma bate com o total', () => {
    const result = splitPurchaseIntoInstallments(100, 3, '2026-01-15');
    expect(result.map((i) => i.amount)).toEqual([33.33, 33.33, 33.34]);
    const sum = result.reduce((acc, i) => acc + i.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });

  it('trava (clamp) no fim do mês em vez de vazar para o mês seguinte', () => {
    const result = splitPurchaseIntoInstallments(300, 3, '2026-01-31');
    expect(result.map((i) => i.dueDate)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });

  it('retorna uma única parcela com o valor total quando numInstallments é 1', () => {
    const result = splitPurchaseIntoInstallments(150.5, 1, '2026-06-01');
    expect(result).toEqual([{ installmentNumber: 1, amount: 150.5, dueDate: '2026-06-01' }]);
  });

  it('lança erro para numInstallments menor que 1', () => {
    expect(() => splitPurchaseIntoInstallments(100, 0, '2026-01-01')).toThrow();
  });
});
