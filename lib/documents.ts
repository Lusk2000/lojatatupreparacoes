// CPF: confere os dígitos verificadores. CNPJ: só o formato, porque desde 2026
// ele também pode ter letras.
const isValidCpf = (cpf: string): boolean => {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  return [9, 10].every((length) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    return ((sum * 10) % 11) % 10 === Number(cpf[length]);
  });
};

export const normalizeDocument = (value: string): string =>
  value.replace(/[^0-9a-z]/gi, '').toUpperCase();

export const isValidDocument = (value: string): boolean => {
  const doc = normalizeDocument(value);
  return isValidCpf(doc) || /^[0-9A-Z]{12}\d{2}$/.test(doc);
};
