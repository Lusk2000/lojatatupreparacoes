import {
  CampaignCopy,
  CampaignFormat,
  CampaignMediaItem,
  CampaignType,
  Product,
  SavedCampaign,
} from '../types';
import {
  GOOGLE_MAPS_SHARE_LINK,
  WHATSAPP_LINK,
  WHATSAPP_NUMBER,
} from '../constants';

export const STORE_IDENTITY = {
  name: 'Tatu Preparações',
  logoUrl: 'https://i.ibb.co/vxtHNfyH/Tatu-prepara-es.png',
  heroImageUrl: 'https://i.ibb.co/x8JZLn94/f250.png',
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: WHATSAPP_LINK,
  mapsUrl: GOOGLE_MAPS_SHARE_LINK,
  location: 'Três Pontas, MG',
};

export const STORE_GALLERY_MEDIA: CampaignMediaItem[] = [
  {
    id: 'gallery-f250-hero',
    kind: 'image',
    url: 'https://i.ibb.co/x8JZLn94/f250.png',
    label: 'F-250 Tatu Preparações (Galeria da Loja)',
    source: 'gallery',
  },
  {
    id: 'gallery-logo',
    kind: 'image',
    url: 'https://i.ibb.co/vxtHNfyH/Tatu-prepara-es.png',
    label: 'Logotipo Oficial Tatu Preparações',
    source: 'gallery',
  },
];

export interface CampaignTypeMeta {
  id: CampaignType;
  label: string;
  objective: string;
}

export const CAMPAIGN_TYPES: CampaignTypeMeta[] = [
  {
    id: 'product_presentation',
    label: 'Apresentação de produto',
    objective: 'Apresentar um produto e destacar suas características e benefícios.',
  },
  {
    id: 'promotional_offer',
    label: 'Oferta promocional',
    objective: 'Divulgar ofertas e condições comerciais reais.',
  },
  {
    id: 'launch',
    label: 'Lançamentos',
    objective: 'Apresentar novidades disponíveis no catálogo.',
  },
  {
    id: 'service_showcase',
    label: 'Divulgação de serviços',
    objective: 'Apresentar serviços, diferenciais e possibilidades de contratação.',
  },
  {
    id: 'sales_campaign',
    label: 'Campanha de vendas',
    objective: 'Estimular o interesse e direcionar o cliente para a compra.',
  },
  {
    id: 'combos_kits',
    label: 'Combos e kits',
    objective: 'Apresentar conjuntos de produtos existentes, sem inventar combinações ou preços.',
  },
  {
    id: 'institutional',
    label: 'Campanha institucional',
    objective: 'Divulgar a loja, seus diferenciais e sua proposta comercial.',
  },
];

export interface CampaignFormatMeta {
  id: CampaignFormat;
  label: string;
  width: number;
  height: number;
  purpose: string;
}

export const CAMPAIGN_FORMATS: CampaignFormatMeta[] = [
  {
    id: '1080x1350',
    label: 'WhatsApp Vertical',
    width: 1080,
    height: 1350,
    purpose: 'Mensagens comerciais e divulgação de produtos.',
  },
  {
    id: '1080x1920',
    label: 'WhatsApp Status',
    width: 1080,
    height: 1920,
    purpose: 'Campanhas verticais e divulgação em status.',
  },
  {
    id: '1080x1080',
    label: 'WhatsApp Quadrado',
    width: 1080,
    height: 1080,
    purpose: 'Divulgação de produtos e campanhas.',
  },
];

export const CTA_EXAMPLES: readonly string[] = [
  'Conheça nosso produto.',
  'Solicite seu orçamento.',
  'Fale com nossa equipe.',
  'Confira todos os detalhes.',
  'Faça seu pedido.',
];

const VERIFIED_STORE_DIFFERENTIALS: readonly string[] = [
  'Envio para todo o Brasil com código de rastreio',
  'Peças e kits testados para linha diesel (F-250, Silverado, RAM e S10)',
  'Atendimento técnico direto para confirmar compatibilidade antes da compra',
];

const VERIFIED_SERVICE_DIFFERENTIALS: readonly string[] = [
  'Orientação técnica para escolher o kit ou peça compatível com seu motor',
  'Orçamento direto pelo WhatsApp, sem burocracia',
  'Atendimento em Três Pontas, MG e despacho nacional com rastreio',
];

export const extractVerifiedSpecs = (product: Product): string[] => {
  if (!product.description) return [];
  const rawLines = product.description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rawLines.length === 1 && rawLines[0].includes('. ')) {
    return rawLines[0]
      .split(/\.\s+/)
      .map((part) => part.replace(/\.$/, '').trim())
      .filter((part) => part.length > 0);
  }

  return rawLines;
};

const pickPrimaryProductsSummary = (products: Product[]): string => {
  if (products.length === 0) return 'Catálogo Tatu Preparações';
  if (products.length === 1) return products[0].name;
  if (products.length === 2) return `${products[0].name} e ${products[1].name}`;
  return `${products[0].name}, ${products[1].name} e mais ${products.length - 2} ${
    products.length - 2 === 1 ? 'item' : 'itens'
  }`;
};

const collectDesirePoints = (
  campaignType: CampaignType,
  products: Product[],
  maxItems: number
): string[] => {
  if (campaignType === 'institutional') {
    return VERIFIED_STORE_DIFFERENTIALS.slice(0, maxItems);
  }

  if (campaignType === 'service_showcase') {
    const productNotes = products.slice(0, 2).map((p) => `${p.name} (${p.category})`);
    return [...productNotes, ...VERIFIED_SERVICE_DIFFERENTIALS].slice(0, maxItems);
  }

  if (products.length > 1) {
    const itemPoints = products.map((p) => {
      const specs = extractVerifiedSpecs(p);
      return specs.length > 0 ? `${p.name} — ${specs[0]}` : `${p.name} (${p.category})`;
    });
    return [...itemPoints, VERIFIED_STORE_DIFFERENTIALS[0]].slice(0, maxItems);
  }

  if (products.length === 1) {
    const specs = extractVerifiedSpecs(products[0]);
    if (specs.length > 0) {
      return [...specs.slice(0, maxItems - 1), VERIFIED_STORE_DIFFERENTIALS[0]].slice(0, maxItems);
    }
    return [
      `Categoria: ${products[0].category}`,
      ...VERIFIED_STORE_DIFFERENTIALS.slice(0, maxItems - 1),
    ];
  }

  return VERIFIED_STORE_DIFFERENTIALS.slice(0, maxItems);
};

export const extractRegisteredProductPrice = (products: Product[]): string => {
  for (const product of products) {
    if (product.price !== undefined && product.price !== null && String(product.price).trim()) {
      const raw = String(product.price).trim();
      if (/^r\$/i.test(raw)) return raw;
      const numeric = Number(raw.replace(',', '.'));
      if (!Number.isNaN(numeric) && numeric > 0) {
        return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
      return raw;
    }
  }
  return '';
};

export const generateCopyVariations = (
  campaignType: CampaignType,
  selectedProducts: Product[],
  selectedCategory: string,
  price: string,
  includeContactLink: boolean,
  cycleOffset = 0,
  hasVideoSelected = false
): CampaignCopy[] => {
  const primary = selectedProducts[0];
  const productSummary = pickPrimaryProductsSummary(selectedProducts);
  const categoryLabel =
    selectedCategory && selectedCategory !== 'Todos'
      ? selectedCategory
      : primary?.category ?? 'Linha Diesel e Acessórios';

  const specs = primary ? extractVerifiedSpecs(primary) : [];
  const firstSpec = specs[0];
  const cleanPrice = price.trim() || extractRegisteredProductPrice(selectedProducts) || undefined;

  const rotateCta = (idx: number) => CTA_EXAMPLES[(idx + cycleOffset) % CTA_EXAMPLES.length];

  const getAttention = (variantIndex: number): string => {
    switch (campaignType) {
      case 'product_presentation':
        if (!primary) return `Conheça a linha ${categoryLabel} — ${STORE_IDENTITY.name}`;
        if (variantIndex === 0) return primary.name;
        if (variantIndex === 1) return `${primary.name} | ${primary.category}`;
        return `Detalhes do ${primary.name}`;
      case 'promotional_offer':
        if (!primary) return `Condições comerciais em ${categoryLabel}`;
        if (variantIndex === 0) return `${primary.name} — Condição Especial`;
        if (variantIndex === 1) return `Condições de compra: ${primary.name}`;
        return `${STORE_IDENTITY.name}: ${productSummary}`;
      case 'launch':
        if (!primary) return `Novidades disponíveis em ${categoryLabel}`;
        if (variantIndex === 0) return `Disponível no catálogo: ${primary.name}`;
        if (variantIndex === 1) return `Novidade ${primary.category}: ${primary.name}`;
        return `Confira no catálogo: ${primary.name}`;
      case 'service_showcase':
        if (variantIndex === 0) return `Atendimento Técnico e Preparação Diesel — ${STORE_IDENTITY.name}`;
        if (variantIndex === 1) return `Suporte especializado para ${categoryLabel}`;
        return `Consultoria na escolha de peças e kits — ${STORE_IDENTITY.name}`;
      case 'sales_campaign':
        if (!primary) return `Peças e kits ${categoryLabel} com envio nacional`;
        if (variantIndex === 0) return `Garanta seu ${primary.name}`;
        if (variantIndex === 1) return `${primary.name} pronto para orçamento`;
        return `Monte sua caminhonete com ${primary.name}`;
      case 'combos_kits':
        if (selectedProducts.length > 1) {
          return variantIndex === 1
            ? `Seleção de produtos: ${selectedProducts.length} itens do catálogo`
            : `Conjunto selecionado: ${productSummary}`;
        }
        return primary ? primary.name : `Kits completos ${categoryLabel}`;
      case 'institutional':
      default:
        if (variantIndex === 0) return `${STORE_IDENTITY.name} — Kits e Peças Linha Diesel`;
        if (variantIndex === 1) return `Especialistas em F-250, Silverado, RAM e S10`;
        return `Qualidade testada e atendimento técnico direto`;
    }
  };

  const getInterest = (variantIndex: number): string => {
    const videoPrefix = hasVideoSelected ? 'Assista ao vídeo demonstrativo: ' : '';
    switch (campaignType) {
      case 'product_presentation':
        if (!primary) {
          return `${videoPrefix}Confira os itens disponíveis na categoria ${categoryLabel} no catálogo oficial da ${STORE_IDENTITY.name}.`;
        }
        if (variantIndex === 0) {
          return `${videoPrefix}${primary.name} faz parte da nossa linha de ${primary.category}, com envio para todo o Brasil.`;
        }
        if (variantIndex === 1 && firstSpec) {
          return `${videoPrefix}Item cadastrado em ${primary.category}. Destaque técnico do cadastro: ${firstSpec}.`;
        }
        return `${videoPrefix}Confira a composição verificada e a compatibilidade para sua caminhonete direto com nossa equipe.`;
      case 'promotional_offer':
        return cleanPrice
          ? `${videoPrefix}Consulte as condições comerciais reais de ${productSummary} na ${STORE_IDENTITY.name} (${cleanPrice}).`
          : `${videoPrefix}Consulte valores atualizados e condições comerciais de ${productSummary} diretamente com nossa equipe.`;
      case 'launch':
        return `${videoPrefix}${productSummary} já está disponível no catálogo oficial da ${STORE_IDENTITY.name} para consulta e pedido.`;
      case 'service_showcase':
        return `${videoPrefix}Nossa equipe auxilia na verificação de compatibilidade por modelo e motor antes da confirmação do seu pedido em ${STORE_IDENTITY.location} ou para envio nacional.`;
      case 'sales_campaign':
        if (variantIndex === 0) {
          return `${videoPrefix}Adquira ${productSummary} diretamente pelo WhatsApp da ${STORE_IDENTITY.name}, sem burocracia.`;
        }
        return `${videoPrefix}Peça verificada para quem busca desempenho e confiabilidade em caminhonetes diesel, com envio rastreado.`;
      case 'combos_kits':
        if (selectedProducts.length > 1) {
          return `${videoPrefix}Reunimos ${selectedProducts.length} itens originais do nosso catálogo (${categoryLabel}) para facilitar sua consulta em um único atendimento.`;
        }
        return `${videoPrefix}${primary?.name ?? 'Kit cadastrado'} reúne os componentes descritos no catálogo oficial da loja.`;
      case 'institutional':
      default:
        return `${videoPrefix}A ${STORE_IDENTITY.name} oferece kits completos, peças testadas para caminhonetes diesel e atendimento técnico direto de ${STORE_IDENTITY.location} para todo o Brasil.`;
    }
  };

  const labels = ['Direta e Objetiva', 'Técnica e Detalhada', 'Consultiva'];

  return [0, 1, 2].map((idx) => ({
    variantId: `variant-${idx + 1}`,
    variantLabel: labels[idx],
    attention: getAttention(idx),
    interest: getInterest(idx),
    desire: collectDesirePoints(campaignType, selectedProducts, idx === 1 ? 5 : 4),
    action: rotateCta(idx),
    price: cleanPrice,
    includeContactLink,
  }));
};

export const formatWhatsAppMessage = (copy: CampaignCopy): string => {
  const lines: string[] = [];

  if (copy.attention.trim()) {
    lines.push(`*${copy.attention.trim()}*`);
  }

  if (copy.interest.trim()) {
    lines.push('', copy.interest.trim());
  }

  const cleanDesire = copy.desire.map((d) => d.trim()).filter(Boolean);
  if (cleanDesire.length > 0) {
    lines.push('', ...cleanDesire.map((item) => `• ${item}`));
  }

  if (copy.price && copy.price.trim()) {
    lines.push('', `*Valor / Condição:* ${copy.price.trim()}`);
  }

  if (copy.action.trim()) {
    lines.push('', copy.action.trim());
  }

  if (copy.includeContactLink) {
    lines.push(
      '',
      `WhatsApp ${STORE_IDENTITY.name}: ${STORE_IDENTITY.whatsappUrl}`,
      `Localização (${STORE_IDENTITY.location}): ${STORE_IDENTITY.mapsUrl}`
    );
  }

  return lines.join('\n').trim();
};

const STORAGE_KEY = 'tatu_wame_campaigns_v1';

export const loadSavedCampaigns = (): SavedCampaign[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedCampaign[]) : [];
  } catch {
    return [];
  }
};

export const persistSavedCampaigns = (campaigns: SavedCampaign[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch {
    // Ignore storage quota errors gracefully
  }
};
