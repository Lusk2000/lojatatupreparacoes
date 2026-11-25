// Valores em centavos, sem passar por ponto flutuante.

export const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Aceita "1.234,56", "1234,56" e "1234". Retorna null se o formato for inválido.
export const parseCents = (text: string): number | null => {
  const value = text.replace(/R\$|\s/g, '');
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  return Number(match[1].replace(/\./g, '')) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
};

export const centsToInput = (cents: number): string =>
  `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
