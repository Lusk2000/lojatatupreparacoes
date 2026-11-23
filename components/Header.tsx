import React, { useState, useEffect, useCallback } from 'react';
import { MenuIcon, CloseIcon, WhatsAppIcon, SearchIcon } from './Icons';
import { WHATSAPP_LINK } from '../constants';
import { useOverlayBehavior } from '../hooks/useOverlayBehavior';

interface HeaderProps {
  onTopClick: () => void;
  onProductsClick: () => void;
  onSearchClick: () => void;
  onHowItWorksClick: () => void;
  onReviewsClick: () => void;
  onCampaignsClick: () => void;
  onContactClick: () => void;
}

interface NavLinkItemProps {
  label: string;
  action: () => void;
  isMobile?: boolean;
  closeMenu?: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ label, action, isMobile, closeMenu }) => {
  const baseClasses = isMobile
    ? "flex items-center w-full text-left px-5 min-h-[52px] text-lg font-['Oswald'] uppercase tracking-wider text-gray-200 border-b border-white/10 hover:text-[#E10600] active:bg-white/5 transition-colors"
    : "text-sm font-medium text-gray-300 hover:text-white hover:underline underline-offset-4 decoration-[#E10600] decoration-2 transition-colors whitespace-nowrap shrink-0 py-2";

  return (
    <button
      type="button"
      onClick={() => {
        action();
        closeMenu?.();
      }}
      className={baseClasses}
    >
      {label}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({
  onTopClick,
  onProductsClick,
  onSearchClick,
  onHowItWorksClick,
  onReviewsClick,
  onCampaignsClick,
  onContactClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  useOverlayBehavior(isOpen, closeMenu);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 12;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Início', action: onTopClick },
    { label: 'Produtos', action: onProductsClick },
    { label: 'Como Funciona', action: onHowItWorksClick },
    { label: 'Depoimentos', action: onReviewsClick },
    { label: 'Campanhas', action: onCampaignsClick },
    { label: 'Contato', action: onContactClick },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-14 md:h-[68px] flex items-center transition-colors duration-200 border-b ${
          isScrolled
            ? 'bg-[#111111]/95 backdrop-blur-md border-white/10 shadow-lg'
            : 'bg-[#111111]/85 backdrop-blur-sm border-transparent'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={onTopClick}
            className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600] rounded-md"
            aria-label="Voltar ao início - Tatu Preparações"
          >
            <img
              src="https://i.ibb.co/vxtHNfyH/Tatu-prepara-es.png"
              alt="Tatu Preparações"
              className="h-10 md:h-12 w-auto object-contain"
              width="120"
              height="48"
              referrerPolicy="no-referrer"
            />
          </button>

          <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
            {navItems.map((item) => (
              <NavLinkItem key={item.label} label={item.label} action={item.action} />
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onSearchClick}
              className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]"
              aria-label="Buscar produtos"
            >
              <SearchIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]"
              aria-expanded={isOpen}
              aria-label="Abrir menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm font-medium py-2.5 px-5 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Fale Conosco no WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Fale Conosco
            </a>
          </div>
        </div>
      </header>

      <div
        className={`md:hidden fixed inset-0 bg-black/75 z-[9998] backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        className={`md:hidden fixed top-0 right-0 w-[82%] max-w-xs h-full bg-[#161616] border-l border-white/10 shadow-2xl transform transition-transform duration-200 ease-out z-[9999] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Menu mobile"
      >
        <div className="px-5 h-14 flex justify-between items-center border-b border-white/10 bg-[#111111] shrink-0">
          <span className="text-white font-bold font-['Oswald'] text-lg uppercase tracking-wider">
            Menu
          </span>
          <button
            type="button"
            onClick={closeMenu}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-gray-300 hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]"
            aria-label="Fechar Menu"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLinkItem
              key={item.label}
              label={item.label}
              action={item.action}
              isMobile
              closeMenu={closeMenu}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#111111] shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-base font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Fale Conosco no WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
};

export default Header;
