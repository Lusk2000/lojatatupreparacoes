import React from 'react';
import { HomeIcon, GridIcon, HelpCircleIcon, WhatsAppIcon } from './Icons';
import { WHATSAPP_LINK } from '../constants';

interface MobileBottomNavProps {
  onTopClick: () => void;
  onProductsClick: () => void;
  onFaqClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onTopClick,
  onProductsClick,
  onFaqClick,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação rápida mobile"
    >
      <div className="grid grid-cols-4 h-14 items-center">
        <button
          type="button"
          onClick={onTopClick}
          className="flex flex-col items-center justify-center min-h-[44px] text-gray-300 hover:text-white active:text-[#E10600] transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5 leading-none">Início</span>
        </button>

        <button
          type="button"
          onClick={onProductsClick}
          className="flex flex-col items-center justify-center min-h-[44px] text-gray-300 hover:text-white active:text-[#E10600] transition-colors"
        >
          <GridIcon className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5 leading-none">Produtos</span>
        </button>

        <button
          type="button"
          onClick={onFaqClick}
          className="flex flex-col items-center justify-center min-h-[44px] text-gray-300 hover:text-white active:text-[#E10600] transition-colors"
        >
          <HelpCircleIcon className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5 leading-none">Dúvidas</span>
        </button>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-h-[44px] text-[#25D366] hover:text-green-400 transition-colors"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span className="text-[11px] font-semibold mt-0.5 leading-none">WhatsApp</span>
        </a>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
