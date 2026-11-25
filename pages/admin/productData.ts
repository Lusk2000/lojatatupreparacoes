// Conversão entre o formulário (texto) e a linha do banco.
import { centsToInput, parseCents } from '../../lib/money';

export interface ProductRecord {
  slug: string;
  name: string;
  category: string;
  description: string;
  price_cents: number | null;
  sku: string | null;
  stock: number | null;
  weight_g: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
  ncm: string | null;
  image_url: string;
  video_url: string | null;
  animation_url?: string | null;
  active: boolean;
  on_quote: boolean;
}

export const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  price: '',
  sku: '',
  stock: '',
  weight: '',
  height: '',
  width: '',
  length: '',
  ncm: '',
  imageUrl: '',
  videoUrl: '',
  animationUrl: '',
  active: true,
  onQuote: false,
};

export type ProductFormValues = typeof EMPTY_FORM;

const text = (value: number | null): string => (value == null ? '' : String(value).replace('.', ','));

export const toFormValues = (r: ProductRecord): ProductFormValues => ({
  name: r.name,
  category: r.category,
  description: r.description,
  price: r.price_cents == null ? '' : centsToInput(r.price_cents),
  sku: r.sku ?? '',
  stock: text(r.stock),
  weight: text(r.weight_g),
  height: text(r.height_cm),
  width: text(r.width_cm),
  length: text(r.length_cm),
  ncm: r.ncm ?? '',
  imageUrl: r.image_url,
  videoUrl: r.video_url ?? '',
  animationUrl: r.animation_url ?? '',
  active: r.active,
  onQuote: r.on_quote,
});

// Campo vazio vira null. Lança Error com a mensagem para o usuário.
export const toRecord = (v: ProductFormValues, slug: string): ProductRecord => {
  const optional = (value: string): string | null => value.trim() || null;

  const integer = (value: string, label: string, min: number): number | null => {
    if (!value.trim()) return null;
    if (!/^\d+$/.test(value.trim()) || Number(value) < min) {
      throw new Error(`${label}: use um número inteiro a partir de ${min}.`);
    }
    return Number(value);
  };

  const measure = (value: string, label: string): number | null => {
    if (!value.trim()) return null;
    const match = /^\d{1,5}([.,]\d)?$/.test(value.trim());
    const number = Number(value.trim().replace(',', '.'));
    if (!match || number <= 0) throw new Error(`${label}: informe em cm, com no máximo uma casa decimal.`);
    return number;
  };

  if (!v.name.trim()) throw new Error('Informe o nome.');
  if (!v.category) throw new Error('Escolha a categoria.');

  let priceCents: number | null = null;
  if (v.price.trim()) {
    priceCents = parseCents(v.price);
    if (priceCents == null || priceCents <= 0 || priceCents > 2_000_000_000) {
      throw new Error('Preço inválido. Use o formato 1.234,56 ou deixe vazio.');
    }
  }

  const ncm = v.ncm.replace(/[.\s]/g, '');
  if (ncm && !/^\d{8}$/.test(ncm)) throw new Error('NCM tem 8 dígitos.');

  return {
    slug,
    name: v.name.trim(),
    category: v.category,
    description: v.description.trim(),
    price_cents: priceCents,
    sku: optional(v.sku),
    stock: integer(v.stock, 'Estoque', 0),
    weight_g: integer(v.weight, 'Peso (gramas)', 1),
    height_cm: measure(v.height, 'Altura'),
    width_cm: measure(v.width, 'Largura'),
    length_cm: measure(v.length, 'Comprimento'),
    ncm: ncm || null,
    image_url: v.imageUrl.trim(),
    video_url: optional(v.videoUrl),
    animation_url: optional(v.animationUrl),
    active: v.active,
    on_quote: v.onQuote,
  };
};
