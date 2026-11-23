import React from 'react';
import { Product } from '../types';
import { WhatsAppIcon, CloseIcon, MegaphoneIcon } from './Icons';
import { buildWhatsAppProductUrl } from '../lib/utils';
import { useOverlayBehavior } from '../hooks/useOverlayBehavior';
import ProductImage from './ProductImage';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onCreateCampaign?: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onCreateCampaign }) => {
  useOverlayBehavior(Boolean(product), onClose);

  if (!product) return null;

  const whatsappUrl = buildWhatsAppProductUrl(product.name);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      <div
        className="bg-[#181818] w-full md:max-w-4xl rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-sheet-up border border-white/15 max-h-[90dvh] md:max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden pt-2.5 pb-1 bg-[#121212] flex justify-center shrink-0">
          <div className="w-10 h-1 bg-white/25 rounded-full" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-3 z-20 min-w-[44px] min-h-[44px] bg-black/65 hover:bg-[#E10600] text-white rounded-full transition-colors flex items-center justify-center backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Fechar detalhes do produto"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 bg-[#121212] flex items-center justify-center p-4 h-52 sm:h-64 md:h-auto shrink-0">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            fallbackClassName="flex flex-col items-center justify-center text-gray-500 p-6"
            iconClassName="w-10 h-10 mb-2 text-[#E10600]/70"
            loading="eager"
          />
        </div>

        <div className="w-full md:w-1/2 flex flex-col min-h-0 flex-1 bg-[#181818] md:border-l md:border-white/10">
          <div className="p-5 sm:p-7 overflow-y-auto flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1.5">
              {product.category}
            </p>
            <h3
              id="modal-product-title"
              className="text-2xl md:text-3xl font-['Oswald'] font-bold text-white leading-tight pr-8"
            >
              {product.name}
            </h3>
            <div className="w-12 h-1 bg-[#E10600] my-4" />

            {product.description ? (
              <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                Consulte disponibilidade, compatibilidade e prazos de envio diretamente pelo WhatsApp.
              </p>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-white/10 bg-[#141414] shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] bg-[#E10600] hover:bg-red-700 active:scale-[0.98] text-white font-['Oswald'] uppercase text-base md:text-lg font-bold py-3 px-6 rounded-xl transition-all duration-150 shadow-lg flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Comprar pelo WhatsApp
            </a>

            {onCreateCampaign && (
              <button
                type="button"
                onClick={() => onCreateCampaign(product)}
                className="w-full min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white font-['Oswald'] uppercase text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MegaphoneIcon className="w-4 h-4 text-[#E10600]" />
                Criar Campanha WhatsApp (WAME)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
