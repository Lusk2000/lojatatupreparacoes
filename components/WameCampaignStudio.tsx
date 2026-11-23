import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CampaignCopy,
  CampaignFormat,
  CampaignMediaItem,
  CampaignMediaType,
  CampaignType,
  GeneratedCampaignOutput,
  GeneratedImageFormat,
  Product,
  SavedCampaign,
} from '../types';
import { CATEGORIES } from '../constants';
import { fetchMergedCatalog } from '../lib/catalog';
import { buildWhatsAppUrl, normalizeText } from '../lib/utils';
import {
  CAMPAIGN_FORMATS,
  CAMPAIGN_TYPES,
  CTA_EXAMPLES,
  STORE_GALLERY_MEDIA,
  STORE_IDENTITY,
  extractRegisteredProductPrice,
  formatWhatsAppMessage,
  generateCopyVariations,
  loadSavedCampaigns,
  persistSavedCampaigns,
} from '../lib/wameGenerator';
import {
  canvasToVerifiedImageFile,
  downloadGeneratedImageBlob,
  resolveSafeImageForCapture,
  tryDecodeImageElement,
} from '../lib/wameCanvasExport';
import {
  deleteCampaignFromDb,
  loadCampaignsFromDb,
  saveCampaignToDb,
} from '../lib/wameStorage';
import WameArtPreview from './WameArtPreview';
import ProductImage from './ProductImage';
import {
  AlertCircleIcon,
  BookmarkIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  ImageIcon,
  MegaphoneIcon,
  RefreshIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrashIcon,
  UploadIcon,
  VideoIcon,
  WhatsAppIcon,
} from './Icons';

interface WameCampaignStudioProps {
  preselectedProduct?: Product | null;
}

const WameCampaignStudio: React.FC<WameCampaignStudioProps> = ({ preselectedProduct }) => {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const [campaignType, setCampaignType] = useState<CampaignType>('product_presentation');
  const [format, setFormat] = useState<CampaignFormat>('1080x1350');
  const [imageFormat, setImageFormat] = useState<GeneratedImageFormat>('PNG');
  const [mediaType, setMediaType] = useState<CampaignMediaType>('image');

  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [productQuery, setProductQuery] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<Array<number | string>>([]);

  const [adminMedia, setAdminMedia] = useState<CampaignMediaItem[]>([]);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);
  const [cycleOffset, setCycleOffset] = useState(0);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);

  const [priceInput, setPriceInput] = useState('');
  const [includeContactLink, setIncludeContactLink] = useState(true);
  const [copy, setCopy] = useState<CampaignCopy>(() =>
    generateCopyVariations('product_presentation', [], 'Todos', '', true, 0)[0]
  );

  // Real generated image/campaign output structure
  const [output, setOutput] = useState<GeneratedCampaignOutput>({
    campaign_title: '',
    campaign_description: '',
    campaign_price: '',
    campaign_cta: '',
    original_product_image_id: '',
    generated_image_url: '',
    generated_image_format: 'PNG',
    original_video_id: null,
    media_type: 'image',
    generation_status: 'idle',
  });
  const [hasPendingVisualChanges, setHasPendingVisualChanges] = useState(false);

  const [isApproved, setIsApproved] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [campaignNameInput, setCampaignNameInput] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const adminMediaUrlsRef = useRef<string[]>([]);
  const activeGeneratedUrlRef = useRef<string>('');
  const renderRequestIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load merged read-only catalog and saved campaigns (IndexedDB with localStorage fallback)
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMergedCatalog(), loadCampaignsFromDb()]).then(([items, dbCampaigns]) => {
      if (cancelled) return;
      setCatalog(items);
      setIsLoadingCatalog(false);

      if (dbCampaigns.length > 0) {
        setSavedCampaigns(dbCampaigns);
      } else {
        setSavedCampaigns(loadSavedCampaigns());
      }

      setSelectedProductIds((prev) => {
        if (prev.length > 0) return prev;
        return items.length > 0 ? [items[0].id] : [];
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    adminMediaUrlsRef.current = adminMedia.map((m) => m.url);
  }, [adminMedia]);

  useEffect(() => {
    return () => {
      adminMediaUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      if (activeGeneratedUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(activeGeneratedUrlRef.current);
      }
    };
  }, []);

  const selectedProducts = useMemo(
    () =>
      selectedProductIds
        .map((id) => catalog.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [catalog, selectedProductIds]
  );

  // Build available original media pool (product photos/videos -> admin uploads -> store gallery)
  const availableMedia: CampaignMediaItem[] = useMemo(() => {
    const productMedia: CampaignMediaItem[] = [];
    for (const p of selectedProducts) {
      if (p.image) {
        productMedia.push({
          id: `product-img-${p.id}`,
          kind: 'image',
          url: p.image,
          label: p.name,
          source: 'product',
          productId: p.id,
        });
      }
      if (p.video) {
        productMedia.push({
          id: `product-vid-${p.id}`,
          kind: 'video',
          url: p.video,
          label: `Vídeo — ${p.name}`,
          source: 'product',
          productId: p.id,
        });
      }
    }

    const seen = new Set<string>();
    const combined: CampaignMediaItem[] = [];
    for (const item of [...productMedia, ...adminMedia, ...STORE_GALLERY_MEDIA]) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        combined.push(item);
      }
    }
    return combined;
  }, [selectedProducts, adminMedia]);

  const selectedMediaItems = useMemo(
    () =>
      selectedMediaUrls
        .map((url) => availableMedia.find((m) => m.url === url))
        .filter((m): m is CampaignMediaItem => Boolean(m)),
    [selectedMediaUrls, availableMedia]
  );

  const selectedImageItems = useMemo(
    () => selectedMediaItems.filter((m) => m.kind === 'image'),
    [selectedMediaItems]
  );

  const selectedVideoItem = useMemo(
    () => selectedMediaItems.find((m) => m.kind === 'video'),
    [selectedMediaItems]
  );

  const formattedMessage = useMemo(() => formatWhatsAppMessage(copy), [copy]);
  const whatsappUrl = useMemo(() => buildWhatsAppUrl(formattedMessage), [formattedMessage]);
  const activeTypeMeta =
    CAMPAIGN_TYPES.find((t) => t.id === campaignType) ?? CAMPAIGN_TYPES[0];

  // Função de renderização usando a API de Canvas do HTML5:
  // desenha a imagem do produto selecionado como background e sobrepõe título, descrição, preço e CTA na identidade Tatu Preparações
  const drawCampaignWithCanvasApi = useCallback(
    async ({
      width,
      height,
      targetFormat,
      targetLabel,
      targetCopy,
      imageSrcs,
      logoSrc,
    }: {
      width: number;
      height: number;
      targetFormat: CampaignFormat;
      targetLabel: string;
      targetCopy: CampaignCopy;
      imageSrcs: string[];
      logoSrc: string | null;
    }): Promise<HTMLCanvasElement | null> => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const drawRoundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      const wrapCanvasText = (text: string, maxWidth: number, maxLines: number): string[] => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        const lines: string[] = [];
        let current = words[0];

        for (let i = 1; i < words.length; i++) {
          const next = `${current} ${words[i]}`;
          if (ctx.measureText(next).width <= maxWidth) {
            current = next;
          } else {
            lines.push(current);
            current = words[i];
            if (lines.length === maxLines) break;
          }
        }

        if (lines.length < maxLines && current) {
          lines.push(current);
        } else if (lines.length === maxLines) {
          const lastIdx = maxLines - 1;
          let trimmed = lines[lastIdx];
          while (ctx.measureText(`${trimmed}...`).width > maxWidth && trimmed.length > 4) {
            trimmed = trimmed.slice(0, -1).trimEnd();
          }
          if (trimmed !== lines[lastIdx]) {
            lines[lastIdx] = `${trimmed}...`;
          }
        }
        return lines;
      };

      const drawContainedImg = (
        img: HTMLImageElement,
        boxX: number,
        boxY: number,
        boxW: number,
        boxH: number,
        pad = 24
      ) => {
        const availW = Math.max(24, boxW - pad * 2);
        const availH = Math.max(24, boxH - pad * 2);
        const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = boxX + (boxW - dw) / 2;
        const dy = boxY + (boxH - dh) / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, dx, dy, dw, dh);
      };

      // 1. Fundo base oficial (#111111)
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, width, height);

      // 2. Desenhar imagem(ns) do produto selecionado como background preservado (sem cortes ou deformações)
      const decodedProducts = (
        await Promise.all(imageSrcs.map((src) => tryDecodeImageElement(src, false)))
      ).filter((img): img is HTMLImageElement => Boolean(img));

      if (decodedProducts.length === 0) return null;

      const stagePadX = 48;
      const stageTop = 126;
      const stageBottom =
        targetFormat === '1080x1920' ? 460 : targetFormat === '1080x1080' ? 320 : 370;
      const stageW = width - stagePadX * 2;
      const stageH = height - stageTop - stageBottom;

      if (decodedProducts.length === 1) {
        drawRoundedRectPath(stagePadX, stageTop, stageW, stageH, 24);
        ctx.fillStyle = '#181818';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        drawContainedImg(decodedProducts[0], stagePadX, stageTop, stageW, stageH, 24);
      } else {
        const gap = 20;
        const cols = 2;
        const rows = decodedProducts.length <= 2 ? 1 : 2;
        const cellW = (stageW - gap) / cols;
        const cellH = rows === 1 ? stageH : (stageH - gap) / 2;

        decodedProducts.slice(0, 4).forEach((img, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cx = stagePadX + col * (cellW + gap);
          const cy = stageTop + row * (cellH + gap);
          drawRoundedRectPath(cx, cy, cellW, cellH, 20);
          ctx.fillStyle = '#181818';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 2;
          ctx.stroke();
          drawContainedImg(img, cx, cy, cellW, cellH, 16);
        });
      }

      // 3. Gradientes de contraste superior e inferior para sobreposição dos textos
      const topGrad = ctx.createLinearGradient(0, 0, 0, 150);
      topGrad.addColorStop(0, 'rgba(17,17,17,0.98)');
      topGrad.addColorStop(0.65, 'rgba(17,17,17,0.72)');
      topGrad.addColorStop(1, 'rgba(17,17,17,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 150);

      const bottomGradH =
        targetFormat === '1080x1920' ? 660 : targetFormat === '1080x1080' ? 460 : 530;
      const bottomGrad = ctx.createLinearGradient(0, height - bottomGradH, 0, height);
      bottomGrad.addColorStop(0, 'rgba(17,17,17,0)');
      bottomGrad.addColorStop(0.22, 'rgba(17,17,17,0.82)');
      bottomGrad.addColorStop(0.42, 'rgba(17,17,17,0.96)');
      bottomGrad.addColorStop(1, 'rgba(17,17,17,1)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, height - bottomGradH, width, bottomGradH);

      // 4. Faixa Vermelha Oficial & Cabeçalho da Marca
      ctx.fillStyle = '#E10600';
      ctx.fillRect(0, 0, width, 10);

      const marginX = 64;
      const contentW = width - marginX * 2;
      const decodedLogo = logoSrc ? await tryDecodeImageElement(logoSrc, false) : null;

      if (decodedLogo) {
        const logoScale = Math.min(220 / decodedLogo.naturalWidth, 68 / decodedLogo.naturalHeight);
        const lw = decodedLogo.naturalWidth * logoScale;
        const lh = decodedLogo.naturalHeight * logoScale;
        ctx.drawImage(decodedLogo, marginX, 34 + (68 - lh) / 2, lw, lh);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 40px "Oswald", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('TATU PREPARAÇÕES', marginX, 68);
      }

      ctx.fillStyle = '#D1D5DB';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(targetLabel.toUpperCase(), width - marginX, 68);
      ctx.textAlign = 'left';

      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginX, 114);
      ctx.lineTo(width - marginX, 114);
      ctx.stroke();

      // 5. Sobreposição de Título, Descrição, Diferenciais, Preço e CTA (Identidade Tatu Preparações)
      const bottomPad = targetFormat === '1080x1920' ? 68 : 48;
      const ctaHeight = 86;
      const ctaY = height - bottomPad - ctaHeight;

      const hasPrice = Boolean(targetCopy.price && targetCopy.price.trim());
      const cleanDesireLines =
        targetFormat === '1080x1080'
          ? []
          : targetCopy.desire
              .map((d) => d.trim())
              .filter(Boolean)
              .slice(0, targetFormat === '1080x1920' ? 3 : 2);

      const titleFontSize = targetFormat === '1080x1080' ? 46 : 54;
      ctx.font = `700 ${titleFontSize}px "Oswald", sans-serif`;
      const titleLines = wrapCanvasText(targetCopy.attention.toUpperCase(), contentW, 2);

      const bodyFontSize = targetFormat === '1080x1080' ? 25 : 29;
      ctx.font = `400 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
      const bodyLines = wrapCanvasText(
        targetCopy.interest,
        contentW,
        targetFormat === '1080x1080' ? 2 : 3
      );

      // Calcular altura total do bloco de texto sobreposto ancorado acima do CTA
      const titleBlockH = titleLines.length * (titleFontSize * 1.12);
      const dividerBlockH = 12 + 6 + 18;
      const bodyBlockH = bodyLines.length * (bodyFontSize * 1.36);
      const desireBlockH = cleanDesireLines.length > 0 ? 14 + cleanDesireLines.length * 36 : 0;
      const priceBlockH = hasPrice ? 52 : 0;
      const totalTextH = titleBlockH + dividerBlockH + bodyBlockH + desireBlockH + priceBlockH + 22;

      let cursorY = ctaY - totalTextH;
      ctx.textBaseline = 'top';

      // Título comercial (Oswald Bold)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${titleFontSize}px "Oswald", sans-serif`;
      titleLines.forEach((line) => {
        ctx.fillText(line, marginX, cursorY);
        cursorY += titleFontSize * 1.12;
      });

      // Linha vermelha Tatu
      cursorY += 12;
      ctx.fillStyle = '#E10600';
      ctx.fillRect(marginX, cursorY, 92, 6);
      cursorY += 24;

      // Descrição curta e objetiva
      ctx.fillStyle = '#E5E7EB';
      ctx.font = `400 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
      bodyLines.forEach((line) => {
        ctx.fillText(line, marginX, cursorY);
        cursorY += bodyFontSize * 1.36;
      });

      // Benefícios verificados (Desejo)
      if (cleanDesireLines.length > 0) {
        cursorY += 14;
        ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
        cleanDesireLines.forEach((bullet) => {
          const fitted = wrapCanvasText(`• ${bullet}`, contentW, 1)[0];
          if (fitted) {
            ctx.fillStyle = '#F3F4F6';
            ctx.fillText(fitted, marginX, cursorY);
            cursorY += 36;
          }
        });
      }

      // Preço verdadeiro cadastrado (quando disponível)
      if (hasPrice && targetCopy.price) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 36px "Oswald", sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(targetCopy.price.trim().toUpperCase(), marginX, ctaY - 16);
      }

      // Botão CTA Oficial (#E10600)
      drawRoundedRectPath(marginX, ctaY, contentW, ctaHeight, 20);
      ctx.fillStyle = '#E10600';
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 32px "Oswald", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${targetCopy.action.toUpperCase()}  ·  WHATSAPP ${STORE_IDENTITY.whatsappNumber.slice(-9)}`,
        width / 2,
        ctaY + ctaHeight / 2
      );
      ctx.textAlign = 'left';

      return canvas;
    },
    []
  );

  // Orquestra o carregamento CORS-seguro da imagem do produto e gera o arquivo PNG/JPG via HTML5 Canvas API
  const generateVisualComposition = useCallback(
    async ({
      targetCopy,
      targetFormat,
      targetImageFormat,
      targetMediaItems,
      targetMediaType,
      targetLabel,
    }: {
      targetCopy: CampaignCopy;
      targetFormat: CampaignFormat;
      targetImageFormat: GeneratedImageFormat;
      targetMediaItems: CampaignMediaItem[];
      targetMediaType: CampaignMediaType;
      targetLabel: string;
    }) => {
      const requestId = ++renderRequestIdRef.current;
      const primaryImage = targetMediaItems.find((m) => m.kind === 'image');
      const primaryVideo = targetMediaItems.find((m) => m.kind === 'video');
      const formatMeta = CAMPAIGN_FORMATS.find((f) => f.id === targetFormat) ?? CAMPAIGN_FORMATS[0];

      if (targetMediaType === 'video' && primaryVideo) {
        setOutput({
          campaign_title: targetCopy.attention,
          campaign_description: formatWhatsAppMessage(targetCopy),
          campaign_price: targetCopy.price ?? '',
          campaign_cta: targetCopy.action,
          original_product_image_id: primaryImage?.id ?? '',
          generated_image_url: '',
          generated_image_format: targetImageFormat,
          original_video_id: primaryVideo.id,
          media_type: 'video',
          generation_status: 'success',
        });
        setHasPendingVisualChanges(false);
        return;
      }

      const imageCandidates = targetMediaItems.filter((m) => m.kind === 'image').slice(0, 4);
      if (imageCandidates.length === 0) {
        setOutput((prev) => ({
          ...prev,
          generated_image_url: '',
          generatedBlob: undefined,
          generatedFile: undefined,
          generation_status: 'error',
          errorMessage:
            'Selecione pelo menos uma fotografia original do catálogo ou envie uma imagem antes de gerar a arte.',
        }));
        setIsApproved(false);
        return;
      }

      setOutput((prev) => ({
        ...prev,
        campaign_title: targetCopy.attention,
        campaign_description: formatWhatsAppMessage(targetCopy),
        campaign_price: targetCopy.price ?? '',
        campaign_cta: targetCopy.action,
        original_product_image_id: primaryImage?.id ?? '',
        generated_image_format: targetImageFormat,
        original_video_id: primaryVideo?.id ?? null,
        media_type: 'image',
        generation_status: 'generating',
        errorMessage: undefined,
      }));

      const temporaryUrlsToRevoke: string[] = [];

      try {
        const resolvedImages = await Promise.all(
          imageCandidates.map((item) => resolveSafeImageForCapture(item.url))
        );
        const validImages = resolvedImages.filter((r): r is NonNullable<typeof r> => Boolean(r));
        validImages.forEach((asset) => {
          if (asset.isObjectUrl) temporaryUrlsToRevoke.push(asset.safeUrl);
        });

        if (validImages.length === 0) {
          setOutput((prev) => ({
            ...prev,
            generated_image_url: '',
            generatedBlob: undefined,
            generatedFile: undefined,
            generation_status: 'error',
            errorMessage:
              'Não foi possível acessar os pixels da fotografia original do produto (CORS/rede). Clique em "Tentar Novamente" ou adicione uma imagem local.',
          }));
          setIsApproved(false);
          return;
        }

        const resolvedLogo = await resolveSafeImageForCapture(STORE_IDENTITY.logoUrl);
        if (resolvedLogo?.isObjectUrl) {
          temporaryUrlsToRevoke.push(resolvedLogo.safeUrl);
        }

        if (requestId !== renderRequestIdRef.current) return;

        const renderedCanvas = await drawCampaignWithCanvasApi({
          width: formatMeta.width,
          height: formatMeta.height,
          targetFormat,
          targetLabel,
          targetCopy,
          imageSrcs: validImages.map((v) => v.safeUrl),
          logoSrc: resolvedLogo?.safeUrl ?? null,
        });

        if (!renderedCanvas || requestId !== renderRequestIdRef.current) {
          if (requestId === renderRequestIdRef.current) {
            setOutput((prev) => ({
              ...prev,
              generated_image_url: '',
              generatedBlob: undefined,
              generatedFile: undefined,
              generation_status: 'error',
              errorMessage: 'Não foi possível desenhar a composição no Canvas HTML5.',
            }));
            setIsApproved(false);
          }
          return;
        }

        const safeSlug = (targetCopy.attention || 'campanha-tatu')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 40);

        const rendered = await canvasToVerifiedImageFile({
          canvas: renderedCanvas,
          format: targetFormat,
          outputImageFormat: targetImageFormat,
          fileNameBase: safeSlug,
        });

        if (requestId !== renderRequestIdRef.current) {
          if (rendered.objectUrl) URL.revokeObjectURL(rendered.objectUrl);
          return;
        }

        if (!rendered.ok || !rendered.objectUrl || !rendered.blob || !rendered.file) {
          setOutput((prev) => ({
            ...prev,
            generated_image_url: '',
            generatedBlob: undefined,
            generatedFile: undefined,
            generation_status: 'error',
            errorMessage:
              rendered.errorMessage ||
              'Não foi possível exportar o arquivo final a partir do Canvas HTML5.',
          }));
          setIsApproved(false);
          return;
        }

        if (activeGeneratedUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(activeGeneratedUrlRef.current);
        }
        activeGeneratedUrlRef.current = rendered.objectUrl;

        setOutput({
          campaign_title: targetCopy.attention,
          campaign_description: formatWhatsAppMessage(targetCopy),
          campaign_price: targetCopy.price ?? '',
          campaign_cta: targetCopy.action,
          original_product_image_id: primaryImage?.id ?? '',
          generated_image_url: rendered.objectUrl,
          generated_image_format: targetImageFormat,
          original_video_id: primaryVideo?.id ?? null,
          media_type: 'image',
          generation_status: 'success',
          generatedBlob: rendered.blob,
          generatedFile: rendered.file,
        });
        setHasPendingVisualChanges(false);
      } catch {
        if (requestId === renderRequestIdRef.current) {
          setOutput((prev) => ({
            ...prev,
            generated_image_url: '',
            generatedBlob: undefined,
            generatedFile: undefined,
            generation_status: 'error',
            errorMessage:
              'Erro inesperado ao renderizar a imagem via Canvas HTML5. Clique em "Tentar Novamente".',
          }));
          setIsApproved(false);
        }
      } finally {
        temporaryUrlsToRevoke.forEach((tempUrl) => URL.revokeObjectURL(tempUrl));
      }
    },
    [drawCampaignWithCanvasApi]
  );

  // Preselect product coming from ProductModal shortcut
  useEffect(() => {
    if (!preselectedProduct) return;
    const registeredPrice = extractRegisteredProductPrice([preselectedProduct]);
    setPriceInput(registeredPrice);
    setCampaignType('product_presentation');
    setSelectedCategory(preselectedProduct.category || 'Todos');
    setSelectedProductIds([preselectedProduct.id]);

    const initialMediaUrls = preselectedProduct.video
      ? [preselectedProduct.image, preselectedProduct.video]
      : [preselectedProduct.image];
    setSelectedMediaUrls(initialMediaUrls);
    setMediaType('image');

    const variants = generateCopyVariations(
      'product_presentation',
      [preselectedProduct],
      preselectedProduct.category,
      registeredPrice,
      includeContactLink,
      0,
      Boolean(preselectedProduct.video)
    );
    const chosenCopy = variants[0];
    setCopy(chosenCopy);
    setActiveVariantIdx(0);
    setIsApproved(false);
    setShareNotice(null);

    const mediaForRender: CampaignMediaItem[] = [
      {
        id: `product-img-${preselectedProduct.id}`,
        kind: 'image',
        url: preselectedProduct.image,
        label: preselectedProduct.name,
        source: 'product',
        productId: preselectedProduct.id,
      },
    ];

    void generateVisualComposition({
      targetCopy: chosenCopy,
      targetFormat: format,
      targetImageFormat: imageFormat,
      targetMediaItems: mediaForRender,
      targetMediaType: 'image',
      targetLabel: CAMPAIGN_TYPES[0].label,
    });
  }, [preselectedProduct]);

  // Trigger initial real PNG generation once the catalog loads its default first product
  const didInitialRenderRef = useRef(false);
  useEffect(() => {
    if (didInitialRenderRef.current || isLoadingCatalog || selectedProducts.length === 0) return;
    didInitialRenderRef.current = true;

    const first = selectedProducts[0];
    const registeredPrice = extractRegisteredProductPrice(selectedProducts);
    if (registeredPrice) setPriceInput(registeredPrice);

    const initialMediaItems: CampaignMediaItem[] = [
      {
        id: `product-img-${first.id}`,
        kind: 'image',
        url: first.image,
        label: first.name,
        source: 'product',
        productId: first.id,
      },
    ];
    setSelectedMediaUrls([first.image]);

    const initialCopy = generateCopyVariations(
      campaignType,
      selectedProducts,
      selectedCategory,
      registeredPrice,
      includeContactLink,
      0,
      false
    )[0];
    setCopy(initialCopy);

    void generateVisualComposition({
      targetCopy: initialCopy,
      targetFormat: format,
      targetImageFormat: imageFormat,
      targetMediaItems: initialMediaItems,
      targetMediaType: 'image',
      targetLabel: activeTypeMeta.label,
    });
  }, [isLoadingCatalog, selectedProducts]);

  // Keep selectedMediaUrls synced with newly chosen products
  useEffect(() => {
    if (!didInitialRenderRef.current) return;
    if (selectedProducts.length === 0) {
      if (campaignType === 'institutional' || campaignType === 'service_showcase') {
        setSelectedMediaUrls((prev) =>
          prev.length > 0 ? prev : [STORE_GALLERY_MEDIA[0].url]
        );
      }
      return;
    }

    const productUrls = selectedProducts
      .flatMap((p) => (p.video ? [p.image, p.video] : [p.image]))
      .filter(Boolean);

    setSelectedMediaUrls((prev) => {
      const preservedAdminOrGallery = prev.filter(
        (u) =>
          adminMedia.some((am) => am.url === u) ||
          STORE_GALLERY_MEDIA.some((gm) => gm.url === u)
      );
      const next = Array.from(new Set([...productUrls, ...preservedAdminOrGallery])).slice(0, 6);
      return next.length > 0 ? next : productUrls;
    });
  }, [selectedProducts, adminMedia, campaignType]);

  const generatedVariants = useMemo(
    () =>
      generateCopyVariations(
        campaignType,
        selectedProducts,
        selectedCategory,
        priceInput,
        includeContactLink,
        cycleOffset,
        Boolean(selectedVideoItem) && mediaType === 'video'
      ),
    [
      campaignType,
      selectedProducts,
      selectedCategory,
      priceInput,
      includeContactLink,
      cycleOffset,
      selectedVideoItem,
      mediaType,
    ]
  );

  const handleGenerateCampaignNow = useCallback(
    (overrideCopy?: CampaignCopy, overrideMedia?: CampaignMediaItem[]) => {
      const targetCopy = overrideCopy ?? copy;
      const targetMedia = overrideMedia ?? selectedMediaItems;
      setIsApproved(false);
      setShareNotice(null);
      void generateVisualComposition({
        targetCopy,
        targetFormat: format,
        targetImageFormat: imageFormat,
        targetMediaItems: targetMedia,
        targetMediaType: mediaType,
        targetLabel: activeTypeMeta.label,
      });
    },
    [copy, selectedMediaItems, format, imageFormat, mediaType, activeTypeMeta.label, generateVisualComposition]
  );

  const handleCampaignTypeChange = (nextType: CampaignType) => {
    setCampaignType(nextType);
    const nextLabel = CAMPAIGN_TYPES.find((t) => t.id === nextType)?.label ?? activeTypeMeta.label;
    const variants = generateCopyVariations(
      nextType,
      selectedProducts,
      selectedCategory,
      priceInput,
      includeContactLink,
      cycleOffset,
      mediaType === 'video'
    );
    const nextCopy = variants[activeVariantIdx] ?? variants[0];
    setCopy(nextCopy);
    setIsApproved(false);

    const mediaToUse =
      selectedMediaItems.length > 0 ? selectedMediaItems : [STORE_GALLERY_MEDIA[0]];
    if (selectedMediaItems.length === 0) {
      setSelectedMediaUrls([STORE_GALLERY_MEDIA[0].url]);
    }

    void generateVisualComposition({
      targetCopy: nextCopy,
      targetFormat: format,
      targetImageFormat: imageFormat,
      targetMediaItems: mediaToUse,
      targetMediaType: mediaType,
      targetLabel: nextLabel,
    });
  };

  const handleToggleProduct = (product: Product) => {
    const exists = selectedProductIds.includes(product.id);
    const nextIds = exists
      ? selectedProductIds.filter((id) => id !== product.id)
      : [...selectedProductIds, product.id];
    setSelectedProductIds(nextIds);

    const nextProducts = nextIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));

    const nextMediaItems: CampaignMediaItem[] = nextProducts.map((p) => ({
      id: `product-img-${p.id}`,
      kind: 'image',
      url: p.image,
      label: p.name,
      source: 'product',
      productId: p.id,
    }));

    const regPrice = extractRegisteredProductPrice(nextProducts);
    if (regPrice && !priceInput) setPriceInput(regPrice);

    const variants = generateCopyVariations(
      campaignType,
      nextProducts,
      selectedCategory,
      priceInput || regPrice,
      includeContactLink,
      cycleOffset,
      mediaType === 'video'
    );
    const nextCopy = variants[activeVariantIdx] ?? variants[0];
    setCopy(nextCopy);
    setIsApproved(false);

    if (nextMediaItems.length > 0) {
      void generateVisualComposition({
        targetCopy: nextCopy,
        targetFormat: format,
        targetImageFormat: imageFormat,
        targetMediaItems: nextMediaItems,
        targetMediaType: mediaType,
        targetLabel: activeTypeMeta.label,
      });
    }
  };

  const handleMediaToggle = (item: CampaignMediaItem) => {
    const exists = selectedMediaUrls.includes(item.url);
    if (exists && selectedMediaUrls.length === 1) return;

    const nextUrls = exists
      ? selectedMediaUrls.filter((u) => u !== item.url)
      : [...selectedMediaUrls, item.url];
    setSelectedMediaUrls(nextUrls);

    const nextItems = nextUrls
      .map((u) => availableMedia.find((m) => m.url === u))
      .filter((m): m is CampaignMediaItem => Boolean(m));

    const nextMediaType: CampaignMediaType =
      item.kind === 'video' && !exists ? 'video' : nextItems.some((m) => m.kind === 'image') ? 'image' : 'video';
    setMediaType(nextMediaType);
    setIsApproved(false);

    void generateVisualComposition({
      targetCopy: copy,
      targetFormat: format,
      targetImageFormat: imageFormat,
      targetMediaItems: nextItems,
      targetMediaType: nextMediaType,
      targetLabel: activeTypeMeta.label,
    });
  };

  const handleAdminUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const added: CampaignMediaItem[] = [];
    files.forEach((file, index) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) return;
      const objectUrl = URL.createObjectURL(file);
      added.push({
        id: `admin-${Date.now()}-${index}`,
        kind: isVideo ? 'video' : 'image',
        url: objectUrl,
        label: file.name,
        source: 'admin',
        file,
      });
    });

    if (added.length > 0) {
      const nextAdmin = [...added, ...adminMedia];
      setAdminMedia(nextAdmin);
      const nextUrls = Array.from(new Set([...added.map((a) => a.url), ...selectedMediaUrls]));
      setSelectedMediaUrls(nextUrls);

      const firstAdded = added[0];
      const nextMediaType: CampaignMediaType = firstAdded.kind === 'video' ? 'video' : 'image';
      setMediaType(nextMediaType);
      setIsApproved(false);

      const pool = [...added, ...availableMedia];
      const nextItems = nextUrls
        .map((u) => pool.find((m) => m.url === u))
        .filter((m): m is CampaignMediaItem => Boolean(m));

      void generateVisualComposition({
        targetCopy: copy,
        targetFormat: format,
        targetImageFormat: imageFormat,
        targetMediaItems: nextItems,
        targetMediaType: nextMediaType,
        targetLabel: activeTypeMeta.label,
      });
    }

    e.target.value = '';
  };

  const handleRemoveAdminMedia = (item: CampaignMediaItem) => {
    if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
    setAdminMedia((prev) => prev.filter((m) => m.id !== item.id));
    setSelectedMediaUrls((prev) => prev.filter((u) => u !== item.url));
    setIsApproved(false);
  };

  const handleSelectVariant = (idx: number) => {
    const chosen = generatedVariants[idx];
    if (!chosen) return;
    setActiveVariantIdx(idx);
    setCopy(chosen);
    setHasPendingVisualChanges(true);
    setIsApproved(false);
  };

  const handleRegenerateVersions = () => {
    const nextOffset = cycleOffset + 1;
    setCycleOffset(nextOffset);
    const variants = generateCopyVariations(
      campaignType,
      selectedProducts,
      selectedCategory,
      priceInput,
      includeContactLink,
      nextOffset,
      mediaType === 'video'
    );
    setCopy(variants[activeVariantIdx] ?? variants[0]);
    setHasPendingVisualChanges(true);
    setIsApproved(false);
  };

  // Editing text preserves the existing generated image (as explicitly required!)
  const updateCopyField = (patch: Partial<CampaignCopy>) => {
    setCopy((prev) => ({ ...prev, ...patch }));
    setHasPendingVisualChanges(true);
    setIsApproved(false);
  };

  const handleFormatChange = (nextFormat: CampaignFormat) => {
    setFormat(nextFormat);
    setIsApproved(false);
    void generateVisualComposition({
      targetCopy: copy,
      targetFormat: nextFormat,
      targetImageFormat: imageFormat,
      targetMediaItems: selectedMediaItems,
      targetMediaType: mediaType,
      targetLabel: activeTypeMeta.label,
    });
  };

  const handleImageFormatChange = (nextExt: GeneratedImageFormat) => {
    setImageFormat(nextExt);
    setIsApproved(false);
    void generateVisualComposition({
      targetCopy: copy,
      targetFormat: format,
      targetImageFormat: nextExt,
      targetMediaItems: selectedMediaItems,
      targetMediaType: mediaType,
      targetLabel: activeTypeMeta.label,
    });
  };

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = normalizeText(productQuery.trim());
    return catalog.filter((item) => {
      const catMatch = selectedCategory === 'Todos' || item.category === selectedCategory;
      if (!catMatch) return false;
      if (!normalizedQuery) return true;
      return normalizeText(`${item.name} ${item.category} ${item.description ?? ''}`).includes(
        normalizedQuery
      );
    });
  }, [catalog, selectedCategory, productQuery]);

  // Strict completion check: when image is required, campaign is NOT complete without valid generated image file
  const hasValidGeneratedOutput =
    mediaType === 'video'
      ? Boolean(selectedVideoItem?.url)
      : output.generation_status === 'success' && Boolean(output.generated_image_url);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2400);
    } catch {
      setShareNotice('Selecione e copie o texto comercial manualmente acima.');
    }
  };

  const handleDownloadGeneratedImage = () => {
    if (!output.generatedBlob) return;
    const ext = output.generated_image_format === 'JPG' ? 'jpg' : 'png';
    const fileName = output.generatedFile?.name || `campanha-tatu-${format}.${ext}`;
    downloadGeneratedImageBlob(output.generatedBlob, fileName);
  };

  const handleDownloadOriginalMedia = async (item: CampaignMediaItem) => {
    const ext = item.kind === 'video' ? 'mp4' : 'png';
    const cleanName = item.label.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(0, 48);

    if (item.url.startsWith('blob:') || item.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = cleanName || `midia-tatu.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const response = await fetch(item.url, { mode: 'cors', cache: 'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        downloadGeneratedImageBlob(blob, cleanName || `midia-tatu.${ext}`);
        return;
      }
    } catch {
      // Fall back to anchor download
    }

    const link = document.createElement('a');
    link.href = item.url;
    link.download = cleanName || `midia-tatu.${ext}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareViaWhatsApp = async () => {
    if (!hasValidGeneratedOutput || !isApproved) return;
    setShareNotice(null);

    let fileToShare: File | undefined =
      mediaType === 'video' ? selectedVideoItem?.file : output.generatedFile;

    if (mediaType === 'video' && !fileToShare && selectedVideoItem?.url) {
      try {
        const res = await fetch(selectedVideoItem.url, { mode: 'cors', cache: 'no-store' });
        if (res.ok) {
          const blob = await res.blob();
          fileToShare = new File([blob], 'video-campanha-tatu.mp4', {
            type: blob.type || 'video/mp4',
          });
        }
      } catch {
        // Fallback to manual download below
      }
    }

    // Compatible devices supporting Web Share Level 2 (sharing actual image/video File + caption)
    if (
      fileToShare &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [fileToShare] })
    ) {
      try {
        await navigator.share({
          files: [fileToShare],
          title: copy.attention || 'Campanha Tatu Preparações',
          text: formattedMessage,
        });
        setShareNotice('Arquivo de mídia e legenda enviados ao seletor de compartilhamento do dispositivo.');
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback when desktop browser does not support Web Share File sharing:
    // Automatically download the real image file + copy caption, and guide manual attachment in WhatsApp
    if (mediaType === 'image' && output.generatedBlob) {
      handleDownloadGeneratedImage();
    } else if (mediaType === 'video' && selectedVideoItem) {
      void handleDownloadOriginalMedia(selectedVideoItem);
    }

    try {
      await navigator.clipboard.writeText(formattedMessage);
    } catch {
      // Clipboard optional
    }

    setShareNotice(
      'Este navegador não permite anexar arquivos diretamente no WhatsApp Web. O arquivo de mídia foi baixado e o texto comercial foi copiado: clique abaixo para abrir a conversa no WhatsApp e anexe o arquivo baixado.'
    );
  };

  const handleSaveCampaign = async () => {
    if (!hasValidGeneratedOutput) return;

    const defaultName =
      campaignNameInput.trim() ||
      copy.attention.trim() ||
      `${activeTypeMeta.label} (${new Date().toLocaleDateString('pt-BR')})`;

    const record: SavedCampaign = {
      id: `wame-${Date.now()}`,
      name: defaultName,
      createdAt: new Date().toISOString(),
      approved: isApproved,
      approvedAt: isApproved ? new Date().toISOString() : undefined,
      campaignType,
      format,
      imageFormat,
      selectedCategory,
      selectedProductIds,
      selectedMediaUrls: selectedMediaUrls.filter((u) => !u.startsWith('blob:')),
      copy,
      output: {
        campaign_title: copy.attention,
        campaign_description: formattedMessage,
        campaign_price: copy.price ?? '',
        campaign_cta: copy.action,
        original_product_image_id: output.original_product_image_id,
        generated_image_url: output.generated_image_url,
        generated_image_format: imageFormat,
        original_video_id: output.original_video_id,
        media_type: mediaType,
        generation_status: output.generation_status,
      },
      generatedImageBlob: output.generatedBlob,
    };

    await saveCampaignToDb(record);

    const next = [record, ...savedCampaigns].slice(0, 20);
    setSavedCampaigns(next);
    // Keep lightweight metadata backup in localStorage (without Blobs)
    persistSavedCampaigns(next.map(({ generatedImageBlob: _blob, ...rest }) => rest));
    setCampaignNameInput('');
    setSaveNotice('Campanha e arquivo de imagem salvos na biblioteca.');
    setTimeout(() => setSaveNotice(null), 2800);
  };

  const handleLoadSavedCampaign = (record: SavedCampaign) => {
    setCampaignType(record.campaignType);
    setFormat(record.format);
    setImageFormat(record.imageFormat ?? 'PNG');
    setSelectedCategory(record.selectedCategory);
    setSelectedProductIds(record.selectedProductIds);
    setSelectedMediaUrls(record.selectedMediaUrls);
    setCopy(record.copy);
    setPriceInput(record.copy.price ?? '');
    setIncludeContactLink(record.copy.includeContactLink);
    setIsApproved(record.approved);
    setShareNotice(null);

    if (record.generatedImageBlob) {
      const restoredUrl = URL.createObjectURL(record.generatedImageBlob);
      if (activeGeneratedUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(activeGeneratedUrlRef.current);
      }
      activeGeneratedUrlRef.current = restoredUrl;
      const ext = (record.imageFormat ?? 'PNG') === 'JPG' ? 'jpg' : 'png';
      const mime = (record.imageFormat ?? 'PNG') === 'JPG' ? 'image/jpeg' : 'image/png';
      const restoredFile = new File([record.generatedImageBlob], `campanha-${record.format}.${ext}`, {
        type: mime,
      });

      setOutput({
        campaign_title: record.copy.attention,
        campaign_description: formatWhatsAppMessage(record.copy),
        campaign_price: record.copy.price ?? '',
        campaign_cta: record.copy.action,
        original_product_image_id: record.output?.original_product_image_id ?? '',
        generated_image_url: restoredUrl,
        generated_image_format: record.imageFormat ?? 'PNG',
        original_video_id: record.output?.original_video_id ?? null,
        media_type: record.output?.media_type ?? 'image',
        generation_status: 'success',
        generatedBlob: record.generatedImageBlob,
        generatedFile: restoredFile,
      });
      setHasPendingVisualChanges(false);
    } else {
      const items = record.selectedMediaUrls
        .map((url) => availableMedia.find((m) => m.url === url))
        .filter((m): m is CampaignMediaItem => Boolean(m));
      void generateVisualComposition({
        targetCopy: record.copy,
        targetFormat: record.format,
        targetImageFormat: record.imageFormat ?? 'PNG',
        targetMediaItems: items,
        targetMediaType: record.output?.media_type ?? 'image',
        targetLabel: activeTypeMeta.label,
      });
    }
  };

  const handleDeleteSavedCampaign = async (id: string) => {
    await deleteCampaignFromDb(id);
    const next = savedCampaigns.filter((c) => c.id !== id);
    setSavedCampaigns(next);
    persistSavedCampaigns(next.map(({ generatedImageBlob: _blob, ...rest }) => rest));
  };

  return (
    <section
      id="campanhas"
      className="py-14 sm:py-20 bg-[#141414] border-t border-white/10"
      aria-labelledby="wame-studio-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E10600] mb-1.5 flex items-center gap-2">
              <MegaphoneIcon className="w-4 h-4" />
              WAME · Gerador de Campanhas Comerciais
            </p>
            <h2
              id="wame-studio-heading"
              className="text-3xl sm:text-4xl font-bold uppercase font-['Oswald'] text-white [text-wrap:balance]"
            >
              Estúdio de Campanhas para <span className="text-[#E10600]">WhatsApp</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
              Gere artes publicitárias reais em PNG ou JPG a partir das fotografias originais dos produtos e textos comerciais prontos para envio.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-300 tabular-nums shrink-0">
            <span>
              <strong className="text-white">{catalog.length}</strong> produtos no catálogo
            </span>
            <span className="text-white/25">·</span>
            <span>
              <strong className="text-white">{savedCampaigns.length}</strong> campanhas salvas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Coluna Esquerda: Configuração do Catálogo, Mídia e Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Objetivo da Campanha */}
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-['Oswald'] text-xl font-bold uppercase text-white">
                  1. Objetivo da Campanha
                </h3>
                <span className="text-xs text-gray-400">7 formatos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CAMPAIGN_TYPES.map((item) => {
                  const active = campaignType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCampaignTypeChange(item.id)}
                      className={`text-left p-3 rounded-xl border transition-colors min-h-[56px] ${
                        active
                          ? 'bg-[#E10600]/15 border-[#E10600] text-white'
                          : 'bg-[#121212] border-white/10 text-gray-300 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <span className="block font-['Oswald'] uppercase text-sm font-semibold tracking-wide">
                        {item.label}
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5 leading-snug">
                        {item.objective}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Seleção de Produtos e Categorias */}
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-['Oswald'] text-xl font-bold uppercase text-white">
                    2. Produtos e Categorias do Catálogo
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Leitura fiel do catálogo oficial — sem alterar produtos, preços ou fotos.
                  </p>
                </div>
                {selectedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductIds([]);
                      setIsApproved(false);
                    }}
                    className="text-xs font-medium text-gray-300 hover:text-white underline underline-offset-4 py-1 px-2"
                  >
                    Limpar seleção ({selectedProducts.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wame-category-select" className="block text-xs text-gray-400 mb-1">
                    Categoria
                  </label>
                  <select
                    id="wame-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full min-h-[44px] px-3 bg-[#121212] border border-white/15 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#E10600]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wame-product-search" className="block text-xs text-gray-400 mb-1">
                    Filtrar produtos
                  </label>
                  <div className="relative flex items-center">
                    <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      id="wame-product-search"
                      type="search"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Nome ou especificação..."
                      className="w-full min-h-[44px] pl-9 pr-9 bg-[#121212] border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#E10600] [&::-webkit-search-cancel-button]:hidden"
                    />
                    {productQuery && (
                      <button
                        type="button"
                        onClick={() => setProductQuery('')}
                        className="absolute right-1 min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-400 hover:text-white"
                        aria-label="Limpar busca de produtos"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isLoadingCatalog ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  Carregando produtos reais do catálogo...
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                  {filteredCatalog.map((product) => {
                    const checked = selectedProductIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleToggleProduct(product)}
                        className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                          checked
                            ? 'bg-[#E10600]/12 border-[#E10600]'
                            : 'bg-[#121212] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-[#181818] border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain"
                            fallbackClassName="text-[10px] text-gray-500"
                            iconClassName="w-4 h-4"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{product.name}</p>
                          <p className="text-xs text-gray-400 truncate">{product.category}</p>
                        </div>
                        <span
                          className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                            checked
                              ? 'bg-[#E10600] border-[#E10600] text-white'
                              : 'border-white/25 text-transparent'
                          }`}
                          aria-hidden="true"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Mídias Originais e Tipo (Imagem ou Vídeo) */}
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-['Oswald'] text-xl font-bold uppercase text-white">
                    3. Mídias Originais (Fotografias e Vídeos)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    As fotografias originais servem de base direta para a composição visual da campanha.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleAdminUpload}
                    className="hidden"
                    id="wame-media-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#121212] hover:bg-white/10 border border-white/20 text-xs sm:text-sm font-medium text-white inline-flex items-center gap-2 transition-colors"
                  >
                    <UploadIcon className="w-4 h-4 text-[#E10600]" />
                    Adicionar Foto / Vídeo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableMedia.map((media) => {
                  const isSelected = selectedMediaUrls.includes(media.url);
                  const sourceLabel =
                    media.source === 'product'
                      ? 'Produto'
                      : media.source === 'admin'
                        ? 'Enviado'
                        : 'Galeria';

                  return (
                    <div
                      key={media.id}
                      className={`relative rounded-xl border overflow-hidden transition-colors ${
                        isSelected
                          ? 'bg-[#E10600]/12 border-[#E10600]'
                          : 'bg-[#121212] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleMediaToggle(media)}
                        className="w-full text-left p-2 focus:outline-none"
                      >
                        <div className="aspect-[4/3] bg-[#181818] rounded-lg flex items-center justify-center p-1.5 overflow-hidden mb-2">
                          {media.kind === 'video' ? (
                            <div className="flex flex-col items-center justify-center text-gray-300">
                              <VideoIcon className="w-7 h-7 text-[#E10600] mb-1" />
                              <span className="text-[11px] uppercase font-medium">Vídeo</span>
                            </div>
                          ) : (
                            <ProductImage
                              src={media.url}
                              alt={media.label}
                              className="max-w-full max-h-full object-contain"
                              fallbackClassName="text-gray-500 text-xs"
                              iconClassName="w-6 h-6"
                            />
                          )}
                        </div>
                        <p className="text-xs font-medium text-white truncate">{media.label}</p>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            {media.kind === 'video' ? (
                              <VideoIcon className="w-3 h-3" />
                            ) : (
                              <ImageIcon className="w-3 h-3" />
                            )}
                            {sourceLabel}
                          </span>
                          <span className={isSelected ? 'text-[#E10600] font-semibold' : ''}>
                            {isSelected ? 'Ativa' : 'Selecionar'}
                          </span>
                        </div>
                      </button>

                      {media.source === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdminMedia(media)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/80 hover:bg-[#E10600] text-white flex items-center justify-center transition-colors"
                          aria-label={`Remover ${media.label}`}
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Copywriting AIDA */}
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-['Oswald'] text-xl font-bold uppercase text-white">
                    4. Copywriting AIDA (Editável sem perder a imagem)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Edite o texto comercial livremente; quando desejar, atualize a arte final com o novo texto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateVersions}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#121212] hover:bg-white/10 border border-white/15 text-xs font-medium text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshIcon className="w-4 h-4 text-[#E10600]" />
                  Gerar novas versões
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {generatedVariants.map((variant, idx) => (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => handleSelectVariant(idx)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      activeVariantIdx === idx
                        ? 'bg-[#E10600] border-[#E10600] text-white'
                        : 'bg-[#121212] border-white/15 text-gray-300 hover:text-white'
                    }`}
                  >
                    Versão {idx + 1} · {variant.variantLabel}
                  </button>
                ))}
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="wame-title" className="block text-xs text-gray-300 mb-1">
                    Atenção — Título comercial
                  </label>
                  <input
                    id="wame-title"
                    type="text"
                    value={copy.attention}
                    onChange={(e) => updateCopyField({ attention: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 bg-[#121212] border border-white/15 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#E10600]"
                  />
                </div>

                <div>
                  <label htmlFor="wame-interest" className="block text-xs text-gray-300 mb-1">
                    Interesse — Apresentação objetiva
                  </label>
                  <textarea
                    id="wame-interest"
                    rows={2}
                    value={copy.interest}
                    onChange={(e) => updateCopyField({ interest: e.target.value })}
                    className="w-full p-3 bg-[#121212] border border-white/15 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#E10600] resize-y"
                  />
                </div>

                <div>
                  <label htmlFor="wame-desire" className="block text-xs text-gray-300 mb-1">
                    Desejo — Características e benefícios reais (um por linha)
                  </label>
                  <textarea
                    id="wame-desire"
                    rows={4}
                    value={copy.desire.join('\n')}
                    onChange={(e) => updateCopyField({ desire: e.target.value.split('\n') })}
                    className="w-full p-3 bg-[#121212] border border-white/15 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#E10600] resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wame-price" className="block text-xs text-gray-300 mb-1">
                      Preço ou condição real cadastrada (opcional)
                    </label>
                    <input
                      id="wame-price"
                      type="text"
                      placeholder="Vazio se sob consulta"
                      value={copy.price ?? ''}
                      onChange={(e) => {
                        setPriceInput(e.target.value);
                        updateCopyField({ price: e.target.value });
                      }}
                      className="w-full min-h-[44px] px-3.5 bg-[#121212] border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#E10600]"
                    />
                  </div>

                  <div>
                    <label htmlFor="wame-action" className="block text-xs text-gray-300 mb-1">
                      Ação — Chamada para ação (CTA)
                    </label>
                    <input
                      id="wame-action"
                      type="text"
                      value={copy.action}
                      onChange={(e) => updateCopyField({ action: e.target.value })}
                      className="w-full min-h-[44px] px-3.5 bg-[#121212] border border-white/15 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#E10600]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CTA_EXAMPLES.map((cta) => (
                    <button
                      key={cta}
                      type="button"
                      onClick={() => updateCopyField({ action: cta })}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        copy.action === cta
                          ? 'bg-white/15 border-white/40 text-white'
                          : 'bg-[#121212] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cta}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2.5 pt-1 text-xs sm:text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copy.includeContactLink}
                    onChange={(e) => {
                      setIncludeContactLink(e.target.checked);
                      updateCopyField({ includeContactLink: e.target.checked });
                    }}
                    className="w-4 h-4 accent-[#E10600] rounded"
                  />
                  Incluir contato WhatsApp e link oficial de localização da loja na mensagem
                </label>
              </div>
            </div>

            {/* 5. Formato e Arquivo Final */}
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-['Oswald'] text-xl font-bold uppercase text-white">
                  5. Dimensões e Arquivo da Imagem Final
                </h3>

                <div className="inline-flex rounded-xl bg-[#121212] border border-white/15 p-1">
                  {(['PNG', 'JPG'] as GeneratedImageFormat[]).map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => handleImageFormatChange(ext)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        imageFormat === ext
                          ? 'bg-[#E10600] text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CAMPAIGN_FORMATS.map((fmt) => {
                  const active = format === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFormatChange(fmt.id)}
                      className={`text-left p-3.5 rounded-xl border transition-colors ${
                        active
                          ? 'bg-[#E10600]/15 border-[#E10600] text-white'
                          : 'bg-[#121212] border-white/10 text-gray-300 hover:border-white/25'
                      }`}
                    >
                      <span className="block font-['Oswald'] uppercase text-sm font-semibold">
                        {fmt.label}
                      </span>
                      <span className="block text-xs text-white/90 font-medium tabular-nums mt-0.5">
                        {fmt.width} × {fmt.height} px
                      </span>
                      <span className="block text-[11px] text-gray-400 mt-1 leading-snug">
                        {fmt.purpose}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Preview Estruturado (Seções 1 a 4) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-5">
              {/* Seção 1: Imagem Publicitária Final em Destaque (ou Vídeo Original) */}
              <WameArtPreview
                format={format}
                imageFormat={imageFormat}
                mediaType={mediaType}
                output={output}
                selectedVideo={selectedVideoItem}
                hasPendingVisualChanges={hasPendingVisualChanges}
                onGenerateVisual={() => handleGenerateCampaignNow()}
              />

              {/* Seção 2: Título e Texto Comercial */}
              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                    2. Título e Texto Comercial
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {formattedMessage.length} caracteres
                  </span>
                </div>
                <pre className="bg-[#121212] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto">
                  {formattedMessage}
                </pre>
              </div>

              {/* Seção 3: Preço e Chamada para Ação */}
              <div className="border-t border-white/10 pt-4 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-200 block">
                  3. Preço e Chamada para Ação
                </span>
                <div className="bg-[#121212] border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-gray-300">
                    <strong className="text-white">Valor:</strong>{' '}
                    {copy.price?.trim() ? copy.price.trim() : 'Sob consulta'}
                  </span>
                  <span className="text-[#E10600] font-semibold">{copy.action}</span>
                </div>
              </div>

              {/* Validação Obrigatória de Mídia Real e Portão de Aprovação */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                {!hasValidGeneratedOutput ? (
                  <div className="p-3 rounded-xl bg-[#E10600]/10 border border-[#E10600]/40 text-xs text-gray-200 flex items-start gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-[#E10600] shrink-0 mt-0.5" />
                    <span>
                      A campanha só pode ser aprovada e concluída após a geração válida do arquivo de imagem ({imageFormat}) a partir da fotografia original do produto.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsApproved((prev) => !prev)}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl border font-['Oswald'] uppercase text-sm sm:text-base font-bold tracking-wide flex items-center justify-center gap-2 transition-colors ${
                      isApproved
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#121212] hover:bg-white/5 border-white/25 text-white'
                    }`}
                  >
                    <ShieldCheckIcon className="w-5 h-5" />
                    {isApproved
                      ? 'Campanha Aprovada com Mídia e Texto'
                      : 'Revisar e Aprovar Campanha'}
                  </button>
                )}

                {/* Seção 4: Opções de Baixar, Copiar e Compartilhar */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-200 block">
                    4. Baixar, Copiar e Compartilhar
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={!isApproved || !hasValidGeneratedOutput}
                      onClick={handleCopyMessage}
                      className={`min-h-[46px] px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border ${
                        isApproved && hasValidGeneratedOutput
                          ? 'bg-[#121212] hover:bg-white/10 border-white/20 text-white'
                          : 'bg-[#121212]/60 border-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {copiedNotice ? (
                        <>
                          <CheckIcon className="w-4 h-4 text-emerald-400" />
                          Texto Copiado
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-4 h-4" />
                          Copiar Texto
                        </>
                      )}
                    </button>

                    {mediaType === 'video' && selectedVideoItem ? (
                      <button
                        type="button"
                        disabled={!isApproved}
                        onClick={() => void handleDownloadOriginalMedia(selectedVideoItem)}
                        className={`min-h-[46px] px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border ${
                          isApproved
                            ? 'bg-[#E10600] hover:bg-red-700 border-[#E10600] text-white'
                            : 'bg-[#121212]/60 border-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Baixar Vídeo Original
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!isApproved || !output.generatedBlob}
                        onClick={handleDownloadGeneratedImage}
                        className={`min-h-[46px] px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border ${
                          isApproved && output.generatedBlob
                            ? 'bg-[#E10600] hover:bg-red-700 border-[#E10600] text-white'
                            : 'bg-[#121212]/60 border-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Baixar Imagem ({imageFormat})
                      </button>
                    )}
                  </div>

                  {selectedImageItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedImageItems.slice(0, 2).map((item) => (
                        <button
                          key={`orig-${item.id}`}
                          type="button"
                          disabled={!isApproved}
                          onClick={() => void handleDownloadOriginalMedia(item)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5 border transition-colors ${
                            isApproved
                              ? 'bg-[#121212] hover:bg-white/10 border-white/15 text-gray-200'
                              : 'bg-[#121212]/50 border-white/5 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          Baixar foto original
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={!isApproved || !hasValidGeneratedOutput}
                      onClick={() => void handleShareViaWhatsApp()}
                      className={`w-full min-h-[48px] font-['Oswald'] uppercase text-base font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                        isApproved && hasValidGeneratedOutput
                          ? 'bg-[#25D366] hover:bg-green-600 text-[#111111]'
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                      Compartilhar Mídia e Texto no WhatsApp
                    </button>

                    {isApproved && hasValidGeneratedOutput && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[42px] bg-[#121212] hover:bg-white/10 border border-white/15 text-gray-200 font-medium text-xs sm:text-sm py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        Abrir Conversa no WhatsApp Web (anexar arquivo baixado)
                      </a>
                    )}
                  </div>

                  {shareNotice && (
                    <p className="text-xs text-gray-200 bg-[#121212] border border-white/15 rounded-xl p-3 leading-relaxed">
                      {shareNotice}
                    </p>
                  )}
                </div>
              </div>

              {/* Salvar Campanha com Imagem Real */}
              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <label htmlFor="wame-save-name" className="block text-xs text-gray-300">
                  Salvar campanha e arquivo de imagem na biblioteca
                </label>
                <div className="flex gap-2">
                  <input
                    id="wame-save-name"
                    type="text"
                    value={campaignNameInput}
                    onChange={(e) => setCampaignNameInput(e.target.value)}
                    placeholder="Nome da campanha (opcional)"
                    className="flex-1 min-h-[44px] px-3 bg-[#121212] border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#E10600]"
                  />
                  <button
                    type="button"
                    disabled={!hasValidGeneratedOutput}
                    onClick={() => void handleSaveCampaign()}
                    className={`min-h-[44px] px-4 rounded-xl border text-sm font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors ${
                      hasValidGeneratedOutput
                        ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                        : 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <BookmarkIcon className="w-4 h-4 text-[#E10600]" />
                    Salvar
                  </button>
                </div>
                {saveNotice && <p className="text-xs text-emerald-400">{saveNotice}</p>}
              </div>
            </div>

            {/* Biblioteca de Campanhas Salvas */}
            {savedCampaigns.length > 0 && (
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-['Oswald'] text-lg font-bold uppercase text-white">
                  Campanhas Salvas
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {savedCampaigns.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#121212] border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadSavedCampaign(item)}
                        className="text-left min-w-0 flex-1"
                      >
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 tabular-nums">
                          {item.format} · {item.imageFormat ?? 'PNG'} ·{' '}
                          {item.approved ? 'Aprovada' : 'Rascunho'} ·{' '}
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSavedCampaign(item.id)}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:text-[#E10600] hover:bg-white/5 transition-colors"
                        aria-label={`Excluir ${item.name}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WameCampaignStudio;
