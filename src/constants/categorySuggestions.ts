// Sugestão de categoria pela descrição. As chaves são os NOMES das categorias
// padrão (ver seed_categories.sql); os valores são palavras-chave em pt-BR.
// A função casa a primeira categoria cuja palavra-chave aparece na descrição.

const KEYWORDS: Record<string, string[]> = {
  Alimentação: [
    'comida', 'lanche', 'lanchonete', 'restaurante', 'ifood', 'pizza', 'pizzaria',
    'hamburguer', 'hamburger', 'burger', 'almoco', 'almoço', 'janta', 'jantar', 'padaria',
    'cafe', 'café', 'bar', 'sushi', 'marmita', 'delivery', 'mcdonalds', 'burguer',
  ],
  Mercado: [
    'mercado', 'supermercado', 'super', 'feira', 'hortifruti', 'sacolao', 'sacolão',
    'atacadao', 'atacadão', 'assai', 'assaí', 'carrefour', 'compras do mes', 'compras do mês',
  ],
  Transporte: [
    'uber', '99', 'taxi', 'táxi', 'gasolina', 'combustivel', 'combustível', 'posto',
    'onibus', 'ônibus', 'metro', 'metrô', 'passagem', 'estacionamento', 'pedagio', 'pedágio',
    'bilhete', 'recarga bilhete', 'etanol', 'alcool', 'álcool',
  ],
  Saúde: [
    'farmacia', 'farmácia', 'remedio', 'remédio', 'medico', 'médico', 'consulta', 'dentista',
    'exame', 'hospital', 'plano de saude', 'plano de saúde', 'academia', 'psicologo', 'psicólogo',
    'terapia', 'drogaria',
  ],
  Lazer: [
    'cinema', 'show', 'ingresso', 'jogo', 'game', 'parque', 'viagem lazer', 'balada',
    'passeio', 'teatro', 'festa',
  ],
  Moradia: [
    'aluguel', 'condominio', 'condomínio', 'luz', 'energia', 'agua', 'água', 'gas', 'gás',
    'iptu', 'reforma', 'moveis', 'móveis', 'faxina', 'diarista',
  ],
  Educação: [
    'curso', 'faculdade', 'escola', 'livro', 'mensalidade', 'material escolar', 'apostila',
    'aula', 'ingles', 'inglês',
  ],
  Vestuário: [
    'roupa', 'roupas', 'sapato', 'tenis', 'tênis', 'camisa', 'calca', 'calça', 'loja de roupa',
    'vestido', 'renner', 'riachuelo',
  ],
  Assinaturas: [
    'netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'youtube premium',
    'assinatura', 'icloud', 'google one', 'deezer',
  ],
  Viagem: [
    'hotel', 'pousada', 'airbnb', 'passagem aerea', 'passagem aérea', 'aviao', 'avião',
    'viagem', 'hospedagem', 'reserva',
  ],
  'Contas e Serviços': [
    'internet', 'telefone', 'celular', 'conta de telefone', 'vivo', 'claro', 'tim', 'oi',
    'boleto', 'fatura', 'streaming',
  ],
  Salário: ['salario', 'salário', 'pagamento', 'contracheque', 'holerite'],
  Freelance: ['freela', 'freelance', 'bico', 'servico', 'serviço prestado'],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Sugere o NOME de uma categoria a partir da descrição. Retorna null se nada
 * casar. Casa por palavra (com limites de palavra) para evitar falsos positivos.
 */
export function suggestCategoryName(description: string): string | null {
  const text = normalize(description);
  if (!text.trim()) return null;

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    for (const keyword of keywords) {
      const kw = normalize(keyword);
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}([^a-z0-9]|$)`);
      if (pattern.test(text)) return category;
    }
  }
  return null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
