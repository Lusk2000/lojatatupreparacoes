import { WHATSAPP_NUMBER } from '../constants';
import { Product } from '../types';
import { hasPreviewPage, productPreviewUrl } from './productShare';

export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalizeCompactText = (value: string): string =>
  normalizeText(value).replace(/[^a-z0-9]/g, '');

export const buildWhatsAppUrl = (message: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const toAbsoluteUrl = (url: string): string => {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
};

const MAX_DESCRIPTION_LINES = 6;

// Monta a mensagem do produto para o WhatsApp. O wa.me só aceita texto, então
// a mídia vai como link: o WhatsApp mostra a prévia do PRIMEIRO link. Para os
// produtos do catálogo fixo, esse link é a página de prévia (/p/<produto>),
// que exibe um card com a foto, o nome e a descrição.
export const buildWhatsAppProductMessage = (product: Product): string => {
  const lines: string[] = ['Olá! Tenho interesse neste produto:', '', `*${product.name}*`];

  if (product.category) lines.push(`Categoria: ${product.category}`);

  if (hasPreviewPage(product)) {
    lines.push('', `📷 Fotos e detalhes: ${productPreviewUrl(product)}`);
  } else if (product.image) {
    lines.push('', `📷 Foto: ${toAbsoluteUrl(product.image)}`);
  }
  if (product.video) lines.push(`🎥 Vídeo: ${toAbsoluteUrl(product.video)}`);

  const descriptionLines = (product.description ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (descriptionLines.length > 0) {
    lines.push('', ...descriptionLines.slice(0, MAX_DESCRIPTION_LINES).map((line) => `• ${line}`));
    if (descriptionLines.length > MAX_DESCRIPTION_LINES) lines.push('• ...');
  }

  if (product.price) lines.push('', `Preço: ${product.price}`);

  lines.push('', 'Quais os valores e condições?');
  return lines.join('\n');
};

export const buildWhatsAppProductUrl = (product: Product): string =>
  buildWhatsAppUrl(buildWhatsAppProductMessage(product));
