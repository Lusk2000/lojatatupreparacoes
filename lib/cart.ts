import { Product } from '../types';

// O navegador guarda só o produto e a quantidade. Preço e estoque vêm sempre do
// catálogo, e o servidor recalcula tudo ao criar o pedido (fase de pagamento).
export interface CartItem {
  slug: string;
  quantity: number;
}

export interface CartLine extends CartItem {
  product?: Product;
  available: boolean;
  totalCents: number;
}

export const isPurchasable = (product: Product): boolean =>
  !product.onQuote && (product.priceCents ?? 0) > 0 && (product.stock ?? 0) > 0;

const isValidItem = (item: unknown): item is CartItem => {
  const { slug, quantity } = (item ?? {}) as Partial<CartItem>;
  return typeof slug === 'string' && slug !== '' && Number.isInteger(quantity) && (quantity as number) > 0;
};

export const parseStoredCart = (raw: string | null): CartItem[] => {
  try {
    const data: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(data)
      ? data.filter(isValidItem).map(({ slug, quantity }) => ({ slug, quantity }))
      : [];
  } catch {
    return [];
  }
};

export const setQuantity = (items: CartItem[], slug: string, quantity: number): CartItem[] => {
  if (!Number.isInteger(quantity)) return items;
  if (quantity <= 0) return items.filter((i) => i.slug !== slug);
  return items.map((i) => (i.slug === slug ? { slug, quantity } : i));
};

export const addToCart = (items: CartItem[], slug: string, stock: number): CartItem[] => {
  const current = items.find((i) => i.slug === slug);
  if (current) return setQuantity(items, slug, Math.min(current.quantity + 1, stock));
  return stock > 0 ? [...items, { slug, quantity: 1 }] : items;
};

// Cruza o carrinho com o catálogo atual: limita ao estoque e marca o que não
// pode mais ser comprado, sem apagar nada.
export const resolveCart = (items: CartItem[], products: Product[]) => {
  const lines: CartLine[] = items.map(({ slug, quantity }) => {
    const product = products.find((p) => String(p.id) === slug);
    if (!product || !isPurchasable(product)) {
      return { slug, quantity, product, available: false, totalCents: 0 };
    }
    const allowed = Math.min(quantity, product.stock!);
    return { slug, quantity: allowed, product, available: true, totalCents: allowed * product.priceCents! };
  });
  return {
    lines,
    subtotalCents: lines.reduce((sum, l) => sum + l.totalCents, 0),
    count: lines.reduce((sum, l) => sum + (l.available ? l.quantity : 0), 0),
  };
};
