import { Product } from '../types';
import { CATEGORIES, STATIC_PRODUCTS } from '../constants';
import { supabase } from './supabase';
import { formatCents } from './money';

export interface Catalog {
  products: Product[];
  categories: string[];
}

const STATIC_CATALOG: Catalog = {
  products: STATIC_PRODUCTS,
  categories: CATEGORIES.filter((c) => c !== 'Todos'),
};

interface ProductRow {
  slug: string;
  name: string;
  category: string;
  description: string;
  price_cents: number | null;
  on_quote: boolean;
  stock: number | null;
  image_url: string;
  video_url: string | null;
  animation_url?: string | null;
}

const toProduct = (row: ProductRow): Product => ({
  id: row.slug,
  priceCents: row.price_cents ?? undefined,
  stock: row.stock ?? undefined,
  onQuote: row.on_quote,
  name: row.name,
  category: row.category,
  description: row.description,
  image: row.image_url,
  video: row.video_url ?? undefined,
  animation: row.animation_url ?? undefined,
  price: row.on_quote
    ? 'Sob consulta'
    : row.price_cents == null
      ? undefined
      : formatCents(row.price_cents),
});

let cached: Promise<Catalog> | null = null;

const loadCatalog = async (): Promise<Catalog> => {
  if (!supabase) return STATIC_CATALOG;
  try {
    const [products, categories] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        // O filtro vale também para a equipe, que enxerga produtos inativos.
        .eq('active', true)
        .order('sort')
        .order('name'),
      supabase.from('categories').select('name').order('sort').order('name'),
    ]);
    if (products.error) throw products.error;
    if (categories.error) throw categories.error;
    return {
      products: (products.data as ProductRow[]).map(toProduct),
      categories: categories.data.map((c) => c.name as string),
    };
  } catch (err) {
    console.warn('Catálogo do banco indisponível, usando o catálogo fixo.', err);
    cached = null; // tenta de novo na próxima vez
    return STATIC_CATALOG;
  }
};

export const fetchCatalog = (): Promise<Catalog> => (cached ??= loadCatalog());

// Usado pelo admin depois de salvar, para a loja não mostrar dados antigos.
export const clearCatalogCache = (): void => {
  cached = null;
};
