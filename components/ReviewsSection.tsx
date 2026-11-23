import React, { useState } from 'react';
import { GOOGLE_MAPS_SHARE_LINK } from '../constants';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { PlaceReviewData } from '../types';
import { useGooglePlace } from './GooglePlaceProvider';
import { ExternalLinkIcon, MapPinIcon, StarIcon } from './Icons';

const MAX_COLLAPSED_CHARS = 190;

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const StarRow: React.FC<{ rating: number; sizeClass?: string }> = ({
  rating,
  sizeClass = 'w-4 h-4',
}) => {
  const rounded = Math.round(rating);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating.toFixed(1)} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`${sizeClass} ${
            star <= rounded ? 'text-amber-400' : 'text-white/15'
          }`}
        />
      ))}
    </div>
  );
};

const ReviewCard: React.FC<{ review: PlaceReviewData }> = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const isLong = review.text.length > MAX_COLLAPSED_CHARS;
  const displayedText =
    isLong && !expanded
      ? `${review.text.slice(0, MAX_COLLAPSED_CHARS).trimEnd()}...`
      : review.text;

  return (
    <article className="bg-[#111111] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-white/20 transition-colors">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {review.authorPhotoUri && !avatarFailed ? (
              <img
                src={review.authorPhotoUri}
                alt={review.authorName}
                width={44}
                height={44}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-11 h-11 rounded-full object-cover border border-white/15 shrink-0 bg-[#1c1c1c]"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-11 h-11 rounded-full bg-[#E10600]/20 border border-[#E10600]/40 text-white font-['Oswald'] font-bold text-sm flex items-center justify-center shrink-0"
              >
                {getInitials(review.authorName)}
              </div>
            )}

            <div className="min-w-0">
              {review.authorUri ? (
                <a
                  href={review.authorUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-semibold text-sm sm:text-base text-white hover:text-[#E10600] truncate transition-colors"
                >
                  {review.authorName}
                </a>
              ) : (
                <p className="font-semibold text-sm sm:text-base text-white truncate">
                  {review.authorName}
                </p>
              )}
              {review.relativeTime && (
                <p className="text-xs text-gray-400 mt-0.5">{review.relativeTime}</p>
              )}
            </div>
          </div>

          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-gray-400 bg-white/5 border border-white/10 rounded-md px-2 py-1">
            Google
          </span>
        </div>

        {review.rating !== null && (
          <div className="flex items-center gap-2">
            <StarRow rating={review.rating} />
            <span className="text-xs font-semibold text-gray-300 tabular-nums">
              {review.rating.toFixed(1)}
            </span>
          </div>
        )}

        <div>
          {review.text ? (
            <>
              <p className="text-sm sm:text-[15px] text-gray-200 leading-relaxed whitespace-pre-line">
                &ldquo;{displayedText}&rdquo;
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="mt-2 text-xs font-semibold text-[#E10600] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600] rounded"
                >
                  {expanded ? 'Mostrar menos' : 'Ler depoimento completo'}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Cliente deixou avaliação por estrelas diretamente no Google Maps.
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-gray-400">
        {review.googleMapsUri ? (
          <a
            href={review.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
          >
            <span>Ver avaliação no Google</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span>Avaliação verificada no Google</span>
        )}

        {review.flagContentUri && (
          <a
            href={review.flagContentUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sinalizar
          </a>
        )}
      </div>
    </article>
  );
};

const ReviewsSection: React.FC = () => {
  const { containerRef, animationClasses } = useScrollReveal<HTMLDivElement>();
  const { place, isLoading } = useGooglePlace();

  const reviews = place?.reviews ?? [];
  const mapsUrl = place?.googleMapsUri || GOOGLE_MAPS_SHARE_LINK;
  const writeReviewUrl = place?.id
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(place.id)}`
    : mapsUrl;

  return (
    <section
      id="depoimentos"
      className="py-12 sm:py-20 bg-[#161616] border-t border-white/10"
    >
      <div
        ref={containerRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animationClasses}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase font-['Oswald'] text-white">
              Depoimentos <span className="text-[#E10600]">Reais</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
              Avaliações reais publicadas por clientes na ficha oficial da Tatu Preparações no Google Maps.
            </p>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between shrink-0">
            {place?.rating !== null && place?.rating !== undefined ? (
              <div className="flex items-center gap-3">
                <span className="font-['Oswald'] text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none">
                  {place.rating.toFixed(1)}
                </span>
                <div>
                  <StarRow rating={place.rating} sizeClass="w-4 h-4" />
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">
                    {place.userRatingCount !== null
                      ? `${place.userRatingCount} avaliações no Google`
                      : 'Avaliações no Google Maps'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <MapPinIcon className="w-5 h-5 text-[#E10600] shrink-0" />
                <span>Avaliações verificadas no Google Maps</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Avaliar no Google
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-['Oswald'] uppercase text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <span>Ver todas</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-white/10 rounded" />
                    <div className="h-3 w-1/3 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="h-4 w-28 bg-white/10 rounded" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-white/10 rounded" />
                  <div className="h-3.5 w-5/6 bg-white/10 rounded" />
                  <div className="h-3.5 w-2/3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((review, index) => (
              <ReviewCard
                key={`${review.authorName}-${review.publishTimeMs ?? index}`}
                review={review}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-10 text-center">
            <p className="text-base sm:text-lg font-semibold text-white">
              Confira todas as avaliações reais dos nossos clientes no Google Maps
            </p>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xl mx-auto">
              Para ver os comentários mais recentes e fotos enviadas por quem já comprou na Tatu Preparações, acesse nossa ficha oficial no Google.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                <MapPinIcon className="w-4 h-4" />
                Ver Avaliações no Google Maps
              </a>
              <a
                href={writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-['Oswald'] uppercase text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
              >
                Deixar sua Avaliação
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
