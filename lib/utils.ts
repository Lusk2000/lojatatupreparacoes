import { WHATSAPP_NUMBER } from '../constants';

export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalizeCompactText = (value: string): string =>
  normalizeText(value).replace(/[^a-z0-9]/g, '');

export const buildWhatsAppUrl = (message: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const buildWhatsAppProductUrl = (productName: string): string =>
  buildWhatsAppUrl(`Olá, tenho interesse no produto: ${productName}. Quais os valores e condições?`);
