// Links de prévia dos produtos para o WhatsApp.
// Este arquivo também é usado pelo vite.config.ts (no build), então não pode
// depender de nada do navegador (window, document).
import { SITE_URL, STATIC_PRODUCTS } from '../constants';
import { Product } from '../types';

export const PRODUCT_QUERY_PARAM = 'produto';

export const productSlug = (product: Pick<Product, 'id' | 'name'>): string =>
  String(product.id || product.name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const STATIC_SLUGS = new Set(STATIC_PRODUCTS.map(productSlug));

// Só os produtos fixos do constants.ts ganham página de prévia no build.
export const hasPreviewPage = (product: Product): boolean =>
  STATIC_SLUGS.has(productSlug(product));

export const productPreviewUrl = (product: Product): string =>
  `${SITE_URL}/p/${productSlug(product)}`;
