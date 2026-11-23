import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

const FAQ_ITEMS = [
  {
    question: 'Vocês enviam kits e peças para todo o Brasil?',
    answer:
      'Sim. Enviamos para todos os estados via transportadora ou Correios, conforme o peso e volume do kit escolhido. Calculamos o frete na hora pelo WhatsApp.',
  },
  {
    question: 'Como funciona a base de troca nas bombas injetoras?',
    answer:
      'Nos kits de 100 cv e 200 cv que incluem bomba injetora preparada e revisada à base de troca, você envia sua bomba original para avaliação ou combinamos o envio direto com nossa equipe técnica.',
  },
  {
    question: 'Como sei qual kit é compatível com a minha caminhonete?',
    answer:
      'Trabalhamos com linhas específicas para F-250 (MWM Sprint / Cummins), Silverado MWM, S10 e RAM. Antes de fechar o pedido, nossa equipe confirma ano e motorização do seu veículo.',
  },
  {
    question: 'Quais são as formas de pagamento?',
    answer:
      'Aceitamos Pix, transferência e parcelamento no cartão de crédito. Consulte as condições atualizadas diretamente no atendimento pelo WhatsApp.',
  },
];

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="duvidas" className="py-12 sm:py-16 bg-[#161616] border-t border-white/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-left sm:text-center">
          <h2 className="text-2xl sm:text-4xl font-bold uppercase font-['Oswald'] text-white">
            Dúvidas <span className="text-[#E10600]">Frequentes</span>
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-gray-400">
            Respostas rápidas sobre envio, compatibilidade e pagamento.
          </p>
        </div>

        <div className="divide-y divide-white/10 border border-white/10 rounded-2xl bg-[#111111] overflow-hidden">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  className="w-full min-h-[56px] px-4 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E10600]"
                >
                  <span className="font-medium text-sm sm:text-base text-white leading-snug">
                    {item.question}
                  </span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#E10600]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 text-sm text-gray-400 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
