import React from 'react';
import { TruckIcon, ShieldCheckIcon, WrenchIcon, WhatsAppIcon } from './Icons';
import { WHATSAPP_LINK } from '../constants';

interface HeroProps {
  onCtaClick: () => void;
}

const TRUST_ITEMS = [
  {
    icon: TruckIcon,
    title: 'Envio Nacional',
    subtitle: 'Despacho para todo o Brasil',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Peças Testadas',
    subtitle: 'Qualidade e durabilidade',
  },
  {
    icon: WrenchIcon,
    title: 'Suporte Técnico',
    subtitle: 'Ajuda na escolha do kit',
  },
  {
    icon: WhatsAppIcon,
    title: 'Linha Diesel',
    subtitle: 'F-250, Silverado, RAM e S10',
  },
];

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  return (
    <>
      <section className="relative min-h-[72svh] sm:min-h-[78vh] flex items-end sm:items-center text-left sm:text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#111111]">
          <img
            src="/media/hero.webp"
            alt="Caminhonete customizada F250"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/75 to-black/45" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 sm:py-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold uppercase tracking-wide font-['Oswald'] leading-[1.1] [text-wrap:balance]">
            Kits e Peças Premium para{' '}
            <span className="text-[#E10600]">F-250, Silverado, RAM</span> e muito mais
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-200 max-w-2xl sm:mx-auto leading-relaxed">
            Monte, personalize e turbine sua caminhonete com kits completos, peças testadas e atendimento técnico direto.
          </p>

          <div className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-start sm:justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onCtaClick}
              className="w-full sm:w-auto min-h-[48px] bg-[#E10600] hover:bg-red-700 active:scale-[0.98] text-white font-['Oswald'] uppercase text-base sm:text-lg font-bold py-3.5 px-8 rounded-xl transition-all duration-150 shadow-[0_4px_20px_rgba(225,6,0,0.35)]"
            >
              Ver Kits e Peças
            </button>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-h-[48px] bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-['Oswald'] uppercase text-base sm:text-lg font-medium py-3.5 px-7 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Prova de Credibilidade Imediata (Lei de Jakob) */}
      <section className="bg-[#161616] border-y border-white/10" aria-label="Diferenciais Tatu Preparações">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#E10600]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-['Oswald'] uppercase text-sm sm:text-base font-semibold text-white leading-tight">
                      {item.title}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 leading-snug mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
