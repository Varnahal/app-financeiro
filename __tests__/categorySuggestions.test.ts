import { suggestCategoryName } from '@/constants/categorySuggestions';

describe('suggestCategoryName', () => {
  it('sugere Alimentação para descrições com comida', () => {
    expect(suggestCategoryName('Comida no trabalho')).toBe('Alimentação');
    expect(suggestCategoryName('iFood almoço')).toBe('Alimentação');
    expect(suggestCategoryName('Restaurante japonês')).toBe('Alimentação');
  });

  it('sugere Transporte para uber/gasolina', () => {
    expect(suggestCategoryName('Uber para casa')).toBe('Transporte');
    expect(suggestCategoryName('gasolina posto shell')).toBe('Transporte');
  });

  it('sugere Saúde para farmácia/remédio', () => {
    expect(suggestCategoryName('Farmácia')).toBe('Saúde');
    expect(suggestCategoryName('remédio da gripe')).toBe('Saúde');
  });

  it('ignora acentos e caixa', () => {
    expect(suggestCategoryName('FARMACIA')).toBe('Saúde');
    expect(suggestCategoryName('condominio do mês')).toBe('Moradia');
  });

  it('casa por palavra inteira, não por substring', () => {
    // "99" isolado é Transporte; dentro de outra palavra não deve casar
    expect(suggestCategoryName('corrida 99')).toBe('Transporte');
    expect(suggestCategoryName('produto 1999 reais')).toBeNull();
  });

  it('retorna null quando nada casa', () => {
    expect(suggestCategoryName('xyz coisa aleatória')).toBeNull();
    expect(suggestCategoryName('')).toBeNull();
  });
});
