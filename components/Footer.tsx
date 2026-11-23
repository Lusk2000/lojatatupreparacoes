import React from 'react';
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from './Icons';
import { INSTAGRAM_LINK, TIKTOK_LINK, WHATSAPP_LINK } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-6">
        <div>
          <p className="font-['Oswald'] text-base uppercase tracking-wider text-white">
            Tatu Preparações
          </p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            © {new Date().getFullYear()} Tatu Preparações - Todos os direitos reservados.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-400" aria-label="Links do rodapé">
          <a href="#produtos" className="hover:text-white transition-colors py-1">
            Produtos
          </a>
          <a href="#como-funciona" className="hover:text-white transition-colors py-1">
            Como Funciona
          </a>
          <a href="#duvidas" className="hover:text-white transition-colors py-1">
            Dúvidas
          </a>
          <a href="#localizacao" className="hover:text-white transition-colors py-1">
            Localização
          </a>
          <a href="#depoimentos" className="hover:text-white transition-colors py-1">
            Depoimentos
          </a>
          <a href="#campanhas" className="hover:text-white transition-colors py-1">
            Campanhas
          </a>
          <a href="#contato" className="hover:text-white transition-colors py-1">
            Contato
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-[#25D366] hover:bg-white/5 transition-colors"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5" />
          </a>
          <a
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-[#E10600] hover:bg-white/5 transition-colors"
            aria-label="Instagram"
          >
            <InstagramIcon className="w-5 h-5" />
          </a>
          <a
            href={TIKTOK_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-[#E10600] hover:bg-white/5 transition-colors"
            aria-label="TikTok"
          >
            <TikTokIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
