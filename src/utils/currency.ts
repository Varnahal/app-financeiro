// Cria o formatador só na primeira vez que é usado (não no carregamento do
// módulo) e com fallback: em alguns builds do Hermes o Intl com moeda pode
// falhar, e um throw no carregamento derrubaria o app inteiro na inicialização.
let currencyFormatter: Intl.NumberFormat | null = null;
let intlUnavailable = false;

function getFormatter(): Intl.NumberFormat | null {
  if (currencyFormatter || intlUnavailable) return currencyFormatter;
  try {
    currencyFormatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  } catch {
    intlUnavailable = true;
  }
  return currencyFormatter;
}

function formatManual(value: number): string {
  const sign = value < 0 ? '-' : '';
  const fixed = Math.abs(value)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${fixed}`;
}

export function formatCurrency(value: number): string {
  const formatter = getFormatter();
  return formatter ? formatter.format(value) : formatManual(value);
}

/** Converte um texto digitado (ex: "1.234,56" ou "1234,56") para número. */
export function parseCurrencyInput(text: string): number {
  const normalized = text
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(,|$))/g, '')
    .replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}
