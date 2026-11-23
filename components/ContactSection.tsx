import React, { useState } from 'react';
import { WhatsAppIcon, InstagramIcon } from './Icons';
import { WHATSAPP_LINK, INSTAGRAM_LINK } from '../constants';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { buildWhatsAppUrl } from '../lib/utils';

type QuoteField = 'name' | 'vehicle' | 'part';
type QuoteValues = Record<QuoteField, string>;
type QuoteErrors = Partial<Record<QuoteField, string>>;

const INITIAL_VALUES: QuoteValues = {
  name: '',
  vehicle: '',
  part: '',
};

const ContactSection: React.FC = () => {
  const { containerRef, animationClasses } = useScrollReveal<HTMLDivElement>();

  const [values, setValues] = useState<QuoteValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<QuoteErrors>({});
  const [readyWaUrl, setReadyWaUrl] = useState<string | null>(null);

  const handleFieldChange = (field: QuoteField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (readyWaUrl) {
      setReadyWaUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: QuoteErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Informe seu nome para o atendimento.';
    if (!values.vehicle.trim()) nextErrors.vehicle = 'Informe sua caminhonete ou motor (ex: F-250 MWM).';
    if (!values.part.trim()) nextErrors.part = 'Descreva o kit ou peça que você procura.';

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setReadyWaUrl(null);
      return;
    }

    const message = `Olá! Me chamo ${values.name.trim()}.\nVeículo: ${values.vehicle.trim()}\nTenho interesse em: ${values.part.trim()}`;
    setReadyWaUrl(buildWhatsAppUrl(message));
  };

  const inputBaseClass =
    'w-full px-3.5 py-2.5 bg-[#181818] border rounded-xl text-white text-base placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#E10600]';

  return (
    <section id="contato" className="py-12 sm:py-20 bg-[#1a1a1a] border-t border-white/10">
      <div
        ref={containerRef}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${animationClasses}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          <div className="text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase font-['Oswald'] text-white">
              Fale <span className="text-[#E10600]">Conosco</span>
            </h2>
            <p className="text-base text-gray-300 mt-3 leading-relaxed">
              Atendimento rápido pelo WhatsApp. Tire dúvidas, peça seu orçamento ou monte o kit completo para a sua caminhonete.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row lg:flex-col gap-3">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] bg-[#25D366] hover:bg-green-600 active:scale-[0.99] text-[#111111] font-['Oswald'] uppercase text-base sm:text-lg font-bold py-3.5 px-6 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5"
              >
                <WhatsAppIcon className="w-6 h-6" />
                Chamar no WhatsApp
              </a>
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] bg-[#111111] hover:bg-white/5 border border-white/15 text-white font-['Oswald'] uppercase text-base sm:text-lg font-medium py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2.5"
              >
                <InstagramIcon className="w-5 h-5 text-[#E10600]" />
                Seguir no Instagram
              </a>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-[#111111] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 text-left"
          >
            <h3 className="font-['Oswald'] text-xl font-bold uppercase text-white">
              Orçamento Rápido
            </h3>

            <div>
              <label
                htmlFor="quote-name"
                className="block text-sm font-medium text-gray-200 mb-1.5"
              >
                1. Seu nome
              </label>
              <input
                id="quote-name"
                type="text"
                autoComplete="name"
                placeholder="Ex: João Silva"
                value={values.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={`${inputBaseClass} min-h-[46px] ${
                  errors.name ? 'border-[#E10600]' : 'border-white/15'
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-[#E10600]" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="quote-vehicle"
                className="block text-sm font-medium text-gray-200 mb-1.5"
              >
                2. Caminhonete e motor
              </label>
              <input
                id="quote-vehicle"
                type="text"
                placeholder="Ex: F-250 MWM 6 cilindros"
                value={values.vehicle}
                onChange={(e) => handleFieldChange('vehicle', e.target.value)}
                className={`${inputBaseClass} min-h-[46px] ${
                  errors.vehicle ? 'border-[#E10600]' : 'border-white/15'
                }`}
              />
              {errors.vehicle && (
                <p className="mt-1.5 text-xs font-medium text-[#E10600]" role="alert">
                  {errors.vehicle}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="quote-part"
                className="block text-sm font-medium text-gray-200 mb-1.5"
              >
                3. Peça ou kit desejado
              </label>
              <textarea
                id="quote-part"
                rows={3}
                placeholder="Ex: Kit 100 cv, escapamento full inox..."
                value={values.part}
                onChange={(e) => handleFieldChange('part', e.target.value)}
                className={`${inputBaseClass} resize-none ${
                  errors.part ? 'border-[#E10600]' : 'border-white/15'
                }`}
              />
              {errors.part && (
                <p className="mt-1.5 text-xs font-medium text-[#E10600]" role="alert">
                  {errors.part}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#E10600] hover:bg-red-700 active:scale-[0.99] text-white font-['Oswald'] uppercase text-base font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Preparar Mensagem no WhatsApp
            </button>

            {readyWaUrl && (
              <div className="p-4 rounded-xl bg-[#181818] border border-[#25D366]/50 space-y-2.5">
                <p className="text-sm text-gray-200">
                  Mensagem pronta com os dados da sua caminhonete. Toque abaixo para abrir o atendimento:
                </p>
                <a
                  href={readyWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] bg-[#25D366] hover:bg-green-600 text-[#111111] font-['Oswald'] uppercase text-base font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Enviar Agora no WhatsApp
                </a>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
