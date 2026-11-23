import React, { useState } from 'react';
import {
  CampaignFormat,
  CampaignMediaItem,
  CampaignMediaType,
  GeneratedCampaignOutput,
  GeneratedImageFormat,
} from '../types';
import { CAMPAIGN_FORMATS } from '../lib/wameGenerator';
import { useOverlayBehavior } from '../hooks/useOverlayBehavior';
import {
  AlertCircleIcon,
  CloseIcon,
  ExpandIcon,
  RefreshIcon,
  VideoIcon,
} from './Icons';

interface WameArtPreviewProps {
  format: CampaignFormat;
  imageFormat: GeneratedImageFormat;
  mediaType: CampaignMediaType;
  output: GeneratedCampaignOutput;
  selectedVideo?: CampaignMediaItem;
  hasPendingVisualChanges: boolean;
  onGenerateVisual: () => void;
}

const ASPECT_CLASS_MAP: Record<CampaignFormat, string> = {
  '1080x1350': 'aspect-[4/5]',
  '1080x1920': 'aspect-[9/16]',
  '1080x1080': 'aspect-square',
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const WameArtPreview: React.FC<WameArtPreviewProps> = ({
  format,
  imageFormat,
  mediaType,
  output,
  selectedVideo,
  hasPendingVisualChanges,
  onGenerateVisual,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  useOverlayBehavior(isZoomOpen, () => setIsZoomOpen(false));

  const formatMeta = CAMPAIGN_FORMATS.find((f) => f.id === format) ?? CAMPAIGN_FORMATS[0];
  const fileSizeText = formatFileSize(output.generatedBlob?.size);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span className="uppercase tracking-wider font-semibold text-gray-200">
          1. Mídia Final Produzida · {formatMeta.label}
        </span>
        <span className="tabular-nums font-medium text-gray-400">
          {formatMeta.width} × {formatMeta.height} px · {imageFormat}
          {fileSizeText ? ` (${fileSizeText})` : ''}
        </span>
      </div>

      {/* Área principal da mídia real gerada (imagem PNG/JPG ou vídeo original) */}
      <div
        className={`w-full max-w-[380px] mx-auto ${ASPECT_CLASS_MAP[format]} bg-[#121212] border border-white/15 rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center`}
      >
        {mediaType === 'video' && selectedVideo ? (
          <div className="w-full h-full flex flex-col justify-between p-3 bg-black">
            <div className="flex items-center justify-between text-xs text-gray-300 pb-2 border-b border-white/10">
              <span className="inline-flex items-center gap-1.5 font-medium truncate">
                <VideoIcon className="w-4 h-4 text-[#E10600] shrink-0" />
                Vídeo Original da Campanha
              </span>
              <span className="text-[11px] text-gray-400 shrink-0">Preservado</span>
            </div>
            <video
              src={selectedVideo.url}
              controls
              preload="metadata"
              className="w-full flex-1 min-h-0 object-contain rounded-lg bg-black my-2"
            />
            <p className="text-[11px] text-gray-400 truncate text-center">
              {selectedVideo.label}
            </p>
          </div>
        ) : output.generation_status === 'generating' ? (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="w-9 h-9 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-white">
              Gerando imagem publicitária real ({imageFormat})...
            </p>
            <p className="text-xs text-gray-400">
              Combinando a fotografia original do produto com a identidade da loja.
            </p>
          </div>
        ) : output.generation_status === 'error' ? (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
            <AlertCircleIcon className="w-10 h-10 text-[#E10600]" />
            <p className="text-sm font-semibold text-white">
              Falha ao produzir o arquivo de imagem
            </p>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
              {output.errorMessage ||
                'Não foi possível renderizar o arquivo final com a imagem selecionada.'}
            </p>
            <button
              type="button"
              onClick={onGenerateVisual}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E10600] hover:bg-red-700 text-white text-xs font-['Oswald'] uppercase tracking-wider font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshIcon className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        ) : output.generation_status === 'success' && output.generated_image_url ? (
          <>
            <img
              src={output.generated_image_url}
              alt={output.campaign_title || 'Imagem publicitária gerada WAME'}
              className="w-full h-full object-contain bg-[#111111]"
            />
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute bottom-3 right-3 min-h-[40px] px-3 py-1.5 rounded-xl bg-black/80 hover:bg-[#E10600] border border-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-sm transition-colors shadow-lg"
              aria-label="Ampliar imagem gerada"
            >
              <ExpandIcon className="w-4 h-4" />
              Ampliar
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
            <p className="text-sm text-gray-300">
              Clique abaixo para produzir a imagem publicitária real com a foto do produto.
            </p>
            <button
              type="button"
              onClick={onGenerateVisual}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm font-bold inline-flex items-center gap-2 transition-colors"
            >
              <RefreshIcon className="w-4 h-4" />
              Gerar Imagem da Campanha
            </button>
          </div>
        )}
      </div>

      {/* Controle para gerar nova composição visual sem perder cadastro ou edição de texto */}
      {mediaType === 'image' && output.generation_status !== 'generating' && (
        <div className="max-w-[380px] mx-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={onGenerateVisual}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#121212] hover:bg-white/10 border border-white/20 text-xs sm:text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshIcon className="w-4 h-4 text-[#E10600]" />
            {hasPendingVisualChanges
              ? 'Aplicar Texto Editado na Nova Imagem'
              : 'Gerar Nova Composição Visual'}
          </button>
          {hasPendingVisualChanges && output.generation_status === 'success' && (
            <p className="text-[11px] text-amber-300 text-center">
              O texto foi editado mantendo a imagem atual. Clique acima se quiser gerar uma nova arte com o texto atualizado.
            </p>
          )}
        </div>
      )}

      {/* Modal para ampliar a imagem real gerada */}
      {isZoomOpen && output.generated_image_url && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm p-4 sm:p-8 flex flex-col items-center justify-center animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da imagem gerada"
        >
          <div
            className="relative max-w-4xl w-full max-h-[90dvh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                <p className="font-['Oswald'] uppercase text-lg font-bold truncate">
                  {output.campaign_title}
                </p>
                <p className="text-xs text-gray-400 tabular-nums">
                  Arquivo real {output.generated_image_format} · {formatMeta.width} × {formatMeta.height} px
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-[#E10600] text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Fechar ampliação"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-[#111111] border border-white/15 rounded-2xl p-3 overflow-hidden">
              <img
                src={output.generated_image_url}
                alt={output.campaign_title}
                className="max-w-full max-h-[75dvh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WameArtPreview;
