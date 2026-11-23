import { CampaignFormat, GeneratedImageFormat } from '../types';
import { CAMPAIGN_FORMATS } from './wameGenerator';

export interface ResolvedImageAsset {
  sourceUrl: string;
  safeUrl: string;
  isObjectUrl: boolean;
  naturalWidth: number;
  naturalHeight: number;
}

export interface VerifiedImageFileResult {
  ok: boolean;
  blob?: Blob;
  file?: File;
  objectUrl?: string;
  format: GeneratedImageFormat;
  width: number;
  height: number;
  errorMessage?: string;
}

const appendCacheBypass = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.set('wame_cors', '1');
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

export const tryDecodeImageElement = (
  src: string,
  useCors = false
): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    if (useCors) {
      img.crossOrigin = 'anonymous';
    }
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Resolves an image URL into a same-origin Blob URL (bypassing non-CORS browser cache)
 * so html2canvas can capture pixels cleanly with allowTaint: false.
 */
export const resolveSafeImageForCapture = async (
  url: string
): Promise<ResolvedImageAsset | null> => {
  if (!url) return null;

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const decoded = await tryDecodeImageElement(url, false);
    return decoded
      ? {
          sourceUrl: url,
          safeUrl: url,
          isObjectUrl: false,
          naturalWidth: decoded.naturalWidth,
          naturalHeight: decoded.naturalHeight,
        }
      : null;
  }

  const candidates = [appendCacheBypass(url), url];
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        mode: 'cors',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
      if (response.ok) {
        const blob = await response.blob();
        const safeUrl = URL.createObjectURL(blob);
        const decoded = await tryDecodeImageElement(safeUrl, false);
        if (decoded) {
          return {
            sourceUrl: url,
            safeUrl,
            isObjectUrl: true,
            naturalWidth: decoded.naturalWidth,
            naturalHeight: decoded.naturalHeight,
          };
        }
        URL.revokeObjectURL(safeUrl);
      }
    } catch {
      // Try next candidate
    }
  }

  return null;
};

export const canvasToVerifiedImageFile = async ({
  canvas,
  format,
  outputImageFormat,
  fileNameBase,
}: {
  canvas: HTMLCanvasElement;
  format: CampaignFormat;
  outputImageFormat: GeneratedImageFormat;
  fileNameBase: string;
}): Promise<VerifiedImageFileResult> => {
  const formatMeta = CAMPAIGN_FORMATS.find((f) => f.id === format) ?? CAMPAIGN_FORMATS[0];
  const mimeType = outputImageFormat === 'JPG' ? 'image/jpeg' : 'image/png';
  const quality = outputImageFormat === 'JPG' ? 0.92 : undefined;
  const ext = outputImageFormat === 'JPG' ? 'jpg' : 'png';

  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((produced) => resolve(produced), mimeType, quality);
    } catch {
      resolve(null);
    }
  });

  if (!blob || blob.size === 0) {
    return {
      ok: false,
      format: outputImageFormat,
      width: formatMeta.width,
      height: formatMeta.height,
      errorMessage: 'Não foi possível converter a composição capturada em arquivo PNG/JPG.',
    };
  }

  const objectUrl = URL.createObjectURL(blob);
  const decoded = await tryDecodeImageElement(objectUrl, false);
  if (!decoded) {
    URL.revokeObjectURL(objectUrl);
    return {
      ok: false,
      format: outputImageFormat,
      width: formatMeta.width,
      height: formatMeta.height,
      errorMessage: 'O arquivo de imagem gerado falhou na verificação de leitura.',
    };
  }

  const fileName = `${fileNameBase || 'campanha-tatu'}-${format}.${ext}`;
  const file = new File([blob], fileName, { type: mimeType });

  return {
    ok: true,
    blob,
    file,
    objectUrl,
    format: outputImageFormat,
    width: formatMeta.width,
    height: formatMeta.height,
  };
};

export const downloadGeneratedImageBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
