import React from 'react';
import { Product } from '../types';
import { WhatsAppIcon } from './Icons';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { buildWhatsAppProductUrl, normalizeText } from '../lib/utils';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: Product;
  index: number;
  onView: (product: Product) => void;
  searchQuery?: string;
  instantAppear?: boolean;
}

const renderHighlightedTitle = (title: string, query?: string) => {
  const trimmed = query?.trim();
  if (!trimmed) return title;

  const tokens = normalizeText(trimmed)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return title;

  const normalizedTitle = normalizeText(title);
  const ranges: Array<[number, number]> = [];

  for (const token of tokens) {
    let startIdx = 0;
    while (startIdx < normalizedTitle.length) {
      const foundIdx = normalizedTitle.indexOf(token, startIdx);
      if (foundIdx === -1) break;
      ranges.push([foundIdx, foundIdx + token.length]);
      startIdx = foundIdx + token.length;
    }
  }

  if (ranges.length === 0) return title;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([start, end], idx) => {
    if (cursor < start) {
      parts.push(title.slice(cursor, start));
    }
    parts.push(
      <mark
        key={`${start}-${idx}`}
        className="bg-[#E10600]/30 text-white rounded-sm px-0.5"
      >
        {title.slice(start, end)}
      </mark>
    );
    cursor = end;
  });

  if (cursor < title.length) {
    parts.push(title.slice(cursor));
  }

  return parts;
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index,
  onView,
  searchQuery,
  instantAppear = false,
}) => {
  const { containerRef, animationClasses } = useScrollReveal<HTMLElement>();
  const whatsappLink = buildWhatsAppProductUrl(product.name);

  return (
    <article
      ref={instantAppear ? undefined : containerRef}
      className={`bg-[#181818] border border-white/10 rounded-2xl overflow-hidden group transition-all duration-200 hover:border-white/25 sm:hover:-translate-y-0.5 flex flex-col h-full ${
        instantAppear ? 'opacity-100 translate-y-0' : animationClasses
      }`}
      style={instantAppear ? undefined : { transitionDelay: `${Math.min(index, 6) * 35}ms` }}
    >
      <button
        type="button"
        onClick={() => onView(product)}
        className="relative w-full aspect-[4/3] bg-[#121212] cursor-pointer overflow-hidden flex-shrink-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E10600]"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <div className="p-3 sm:p-5 flex flex-col justify-between flex-grow">
        <div>
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-gray-400 mb-1 truncate">
            {product.category}
          </p>
          <h3 className="font-['Oswald'] text-sm sm:text-lg font-bold text-white leading-snug line-clamp-2 min-h-[2.4rem] sm:min-h-[3rem]">
            <button
              type="button"
              onClick={() => onView(product)}
              className="text-left hover:text-[#E10600] transition-colors focus:outline-none"
            >
              {renderHighlightedTitle(product.name, searchQuery)}
            </button>
          </h3>

          {product.description && (
            <p className="mt-1.5 text-xs sm:text-sm text-gray-400 leading-snug line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-3 sm:mt-4 pt-2 border-t border-white/5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onView(product)}
            className="w-full text-left text-xs font-semibold text-gray-300 hover:text-[#E10600] py-1 transition-colors flex items-center justify-between"
          >
            <span>Ver especificações</span>
            <span aria-hidden="true">→</span>
          </button>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] bg-[#E10600] hover:bg-red-700 active:scale-[0.98] text-white font-['Oswald'] uppercase text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Consultar</span>
            <span className="hidden sm:inline">Pedir no WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
