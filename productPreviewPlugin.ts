// Plugin do Vite que, no build, cria uma página de prévia por produto em
// /p/<produto>/index.html. O WhatsApp lê as tags og:* dessa página e mostra
// o card com foto, nome e descrição. Quem clica é redirecionado ao site com o
// produto aberto.
//
// As miniaturas ficam em public/og/<produto>.jpg (versionadas no repositório).
// Se faltar alguma (produto novo), o build baixa uma versão leve pelo wsrv.nl,
// serviço gratuito de redimensionamento, e salva em public/og/.
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { SITE_URL, STATIC_PRODUCTS } from './constants';
import { PRODUCT_QUERY_PARAM, productSlug } from './lib/productShare';
import { Product } from './types';

const OG_DIR = path.resolve(__dirname, 'public/og');
const THUMB_TIMEOUT_MS = 90_000;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const thumbnailSourceUrl = (imageUrl: string): string =>
  `https://wsrv.nl/?url=${encodeURIComponent(
    new URL(imageUrl, SITE_URL).href.replace(/^https?:\/\//, '')
  )}&w=800&h=800&fit=inside&output=jpg&q=80`;

const thumbPath = (slug: string): string => path.join(OG_DIR, `${slug}.jpg`);

const THUMB_BATCH_SIZE = 4;
const THUMB_ATTEMPTS = 3;

const downloadThumbnail = async (product: Product): Promise<boolean> => {
  const slug = productSlug(product);
  let lastError: unknown;
  for (let attempt = 1; attempt <= THUMB_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(thumbnailSourceUrl(product.image), {
        signal: AbortSignal.timeout(THUMB_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      fs.writeFileSync(thumbPath(slug), Buffer.from(await response.arrayBuffer()));
      return true;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
  console.warn(
    `[prévia] Sem miniatura para "${slug}" (${lastError}). A prévia usará o wsrv.nl direto.`
  );
  return false;
};

// Poucas por vez: muitas requisições simultâneas fazem o wsrv.nl recusar.
const downloadThumbnails = async (products: Product[]): Promise<void> => {
  for (let i = 0; i < products.length; i += THUMB_BATCH_SIZE) {
    await Promise.all(products.slice(i, i + THUMB_BATCH_SIZE).map(downloadThumbnail));
  }
};

const describe = (product: Product): string => {
  const firstLines = (product.description ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');
  return firstLines || `${product.category} · Tatu Preparações. Envio para todo o Brasil.`;
};

const renderPage = (product: Product, imageUrl: string): string => {
  const slug = productSlug(product);
  const pageUrl = `${SITE_URL}/p/${slug}`;
  const target = `/?${PRODUCT_QUERY_PARAM}=${encodeURIComponent(slug)}`;
  const title = escapeHtml(`${product.name} | Tatu Preparações`);
  const description = escapeHtml(describe(product));
  const image = escapeHtml(imageUrl);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Tatu Preparações">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:alt" content="${escapeHtml(product.name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<link rel="canonical" href="${pageUrl}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:40px">
<p>Abrindo <a href="${target}" style="color:#E10600">${escapeHtml(product.name)}</a>…</p>
</body>
</html>
`;
};

export const productPreviewPages = (): Plugin => ({
  name: 'product-preview-pages',
  apply: 'build',
  async buildStart() {
    fs.mkdirSync(OG_DIR, { recursive: true });
    const missing = STATIC_PRODUCTS.filter(
      (product) => product.image && !fs.existsSync(thumbPath(productSlug(product)))
    );
    if (missing.length > 0) {
      console.log(`[prévia] Gerando ${missing.length} miniatura(s) em public/og/...`);
      await downloadThumbnails(missing);
    }
  },
  generateBundle() {
    for (const product of STATIC_PRODUCTS) {
      const slug = productSlug(product);
      const imageUrl = fs.existsSync(thumbPath(slug))
        ? `${SITE_URL}/og/${slug}.jpg`
        : thumbnailSourceUrl(product.image);
      this.emitFile({
        type: 'asset',
        fileName: `p/${slug}/index.html`,
        source: renderPage(product, imageUrl),
      });
    }
  },
});
