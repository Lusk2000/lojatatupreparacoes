import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const STEPS = [
  {
    number: '01',
    title: 'Escolha o kit ou peça',
    description:
      'Navegue pelo catálogo, filtre pelo modelo da sua caminhonete e veja os itens inclusos em cada kit.',
  },
  {
    number: '02',
    title: 'Confirme no WhatsApp',
    description:
      'Fale direto com nossa equipe técnica para confirmar compatibilidade, valores e base de troca.',
  },
  {
    number: '03',
    title: 'Envio para todo o Brasil',
    description:
      'Após a confirmação do pedido, despachamos com segurança e código de rastreio até a sua cidade.',
  },
];

const HowItWorksSection: React.FC = () => {
  const { containerRef, animationClasses } = useScrollReveal<HTMLDivElement>();

  return (
    <section id="como-funciona" className="py-12 sm:py-16 bg-[#111111] border-t border-white/10">
      <div
        ref={containerRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animationClasses}`}
      >
        <div className="mb-8 sm:mb-10 text-left sm:text-center">
          <h2 className="text-2xl sm:text-4xl font-bold uppercase font-['Oswald'] text-white">
            Como <span className="text-[#E10600]">Funciona</span>
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-gray-400 max-w-xl sm:mx-auto">
            Compra simples e direta, sem cadastro longo nem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 flex md:flex-col items-start gap-4"
            >
              <span className="font-['Oswald'] text-2xl sm:text-3xl font-bold text-[#E10600] tabular-nums shrink-0 leading-none">
                {step.number}.
              </span>
              <div>
                <h3 className="font-['Oswald'] text-lg sm:text-xl font-bold text-white uppercase">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
