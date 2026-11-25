import React, { useCallback, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import {
  GOOGLE_MAPS_SHARE_LINK,
  LOCATION_SEARCH_QUERY,
  WHATSAPP_LINK,
} from '../constants';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { PlaceDetailsData } from '../types';
import { useGooglePlace } from './GooglePlaceProvider';
import { MapPinIcon, WhatsAppIcon } from './Icons';

// Embed público do Google Maps: gratuito e não exige chave de API.
const FREE_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(
  LOCATION_SEARCH_QUERY
)}&hl=pt-BR&z=16&output=embed`;

const FreeMapEmbed: React.FC = () => (
  <div className="w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-white/15 bg-[#121212]">
    <iframe
      title="Localização da Tatu Preparações no Google Maps"
      src={FREE_MAP_EMBED_URL}
      className="w-full h-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  </div>
);

interface InteractiveMapCardProps {
  place: PlaceDetailsData;
}

const InteractiveMapCard: React.FC<InteractiveMapCardProps> = ({ place }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  const handleCloseInfo = useCallback(() => setInfoOpen(false), []);
  const handleMarkerClick = useCallback(() => setInfoOpen((prev) => !prev), []);

  return (
    <div className="w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-white/15 bg-[#121212]">
      <Map
        defaultCenter={place.location}
        defaultZoom={16}
        mapId="DEMO_MAP_ID"
        gestureHandling="cooperative"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker
          ref={markerRef}
          position={place.location}
          title={place.displayName}
          onClick={handleMarkerClick}
        >
          <Pin
            background="#E10600"
            borderColor="#8F0400"
            glyphColor="#FFFFFF"
          />
        </AdvancedMarker>

        {infoOpen && marker && (
          <InfoWindow
            anchor={marker}
            maxWidth={260}
            onCloseClick={handleCloseInfo}
          >
            <div className="text-[#111111] p-1 space-y-1">
              <p className="font-bold text-sm leading-tight">{place.displayName}</p>
              {place.formattedAddress && (
                <p className="text-xs text-gray-700 leading-snug">
                  {place.formattedAddress}
                </p>
              )}
              {place.rating !== null && (
                <p className="text-xs font-medium text-gray-800">
                  ★ {place.rating.toFixed(1)}
                  {place.userRatingCount !== null
                    ? ` (${place.userRatingCount} avaliações)`
                    : ''}
                </p>
              )}
              <a
                href={place.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-[#E10600] hover:underline pt-0.5"
              >
                Abrir rotas no Google Maps →
              </a>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};

const LocationSection: React.FC = () => {
  const { containerRef, animationClasses } = useScrollReveal<HTMLDivElement>();
  const { place: placeData, isLoading, errorMessage, hasApiKey } = useGooglePlace();

  const mapsLink = placeData?.googleMapsUri || GOOGLE_MAPS_SHARE_LINK;

  return (
    <section
      id="localizacao"
      className="py-12 sm:py-20 bg-[#111111] border-t border-white/10"
    >
      <div
        ref={containerRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animationClasses}`}
      >
        <div className="mb-8 sm:mb-10 text-left sm:text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase font-['Oswald'] text-white">
            Nossa <span className="text-[#E10600]">Localização</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl sm:mx-auto">
            Confira onde estamos localizados e trace sua rota diretamente pelo Google Maps.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          <div className="lg:col-span-7">
            {!hasApiKey ? (
              <FreeMapEmbed />
            ) : isLoading ? (
              <div className="w-full h-[340px] sm:h-[420px] rounded-2xl border border-white/10 bg-[#181818] animate-pulse flex flex-col items-center justify-center p-6 text-center">
                <MapPinIcon className="w-8 h-8 text-[#E10600]/80 mb-3" />
                <p className="text-sm text-gray-300">Carregando mapa do Google Maps...</p>
              </div>
            ) : errorMessage || !placeData ? (
              <FreeMapEmbed />
            ) : (
              <InteractiveMapCard place={placeData} />
            )}
          </div>

          <div className="lg:col-span-5 bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#E10600]/15 border border-[#E10600]/30 flex items-center justify-center shrink-0 text-[#E10600]">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Google Maps Oficial
                  </p>
                  <h3 className="font-['Oswald'] text-2xl font-bold text-white leading-tight mt-0.5">
                    {placeData?.displayName || 'Tatu Preparações'}
                  </h3>
                </div>
              </div>

              {placeData?.formattedAddress && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Endereço
                  </p>
                  <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                    {placeData.formattedAddress}
                  </p>
                </div>
              )}

              {placeData && placeData.rating !== null && (
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-base">
                    ★ {placeData.rating.toFixed(1)}
                  </span>
                  {placeData.userRatingCount !== null && (
                    <span className="text-xs sm:text-sm text-gray-400">
                      ({placeData.userRatingCount} avaliações no Google)
                    </span>
                  )}
                </div>
              )}

              {placeData && placeData.weekdayDescriptions.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1.5">
                    Horário de Funcionamento
                  </p>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-300">
                    {placeData.weekdayDescriptions.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!placeData && !errorMessage && (
                <p className="text-sm text-gray-400 leading-relaxed">
                  Consulte rotas, endereço completo e atendimento diretamente pelo Google Maps ou fale com nossa equipe no WhatsApp.
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] bg-[#E10600] hover:bg-red-700 active:scale-[0.99] text-white font-['Oswald'] uppercase text-base font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MapPinIcon className="w-5 h-5" />
                Como Chegar no Google Maps
              </a>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] bg-white/5 hover:bg-white/10 border border-white/15 text-white font-['Oswald'] uppercase text-base font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                Agendar ou Tirar Dúvidas
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
