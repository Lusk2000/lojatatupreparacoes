import React from 'react';
import { STATIC_PRODUCTS } from '../constants';
import { Product } from '../types';
import { useScrollReveal } from '../hooks/useScrollReveal';
import ProductCard from './ProductCard';
import { WhatsAppIcon } from './Icons';
import { buildWhatsAppProductUrl } from '../lib/utils';
import ProductImage from './ProductImage';

interface CategorySectionProps {
  category: string;
  title: string;
  highlightedTitle: string;
  description: string;
  bgColor: string;
  hasBorderTop?: boolean;
  onSelectProduct: (product: Product) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  title,
  highlightedTitle,
  description,
  bgColor,
  hasBorderTop = false,
  onSelectProduct,
}) => {
  const { containerRef: headerRef, animationClasses: headerAnimation } =
    useScrollReveal<HTMLDivElement>();

  const products = STATIC_PRODUCTS.filter((product) => product.category === category);

  if (products.length === 0) return null;

  const isSingleFeatured = products.length === 1;
  const featured = products[0];
  const featuredWaLink = buildWhatsAppProductUrl(featured.name);

  return (
    <section
      className={`py-12 sm:py-16 relative ${bgColor} ${
        hasBorderTop ? 'border-t border-white/10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 ${headerAnimation}`}
        >
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase font-['Oswald'] text-white">
              {title} <span className="text-[#E10600]">{highlightedTitle}</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mt-1.5 max-w-2xl">
              {description}
            </p>
          </div>
          {!isSingleFeatured && (
            <span className="md:hidden text-xs font-medium text-gray-400">
              Deslize para ver mais →
            </span>
          )}
        </div>

        {isSingleFeatured ? (
          <div className="bg-[#181818] border border-white/10 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onSelectProduct(featured)}
              className="aspect-[4/3] md:aspect-auto md:min-h-[300px] bg-[#121212] overflow-hidden cursor-pointer focus:outline-none"
              aria-label={`Ampliar ${featured.name}`}
            >
              <ProductImage
                src={featured.image}
                alt={featured.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                iconClassName="w-10 h-10 mb-2 text-[#E10600]/70"
              />
            </button>
            <div className="p-5 sm:p-8 flex flex-col justify-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1.5">
                {featured.category}
              </p>
              <h3 className="font-['Oswald'] text-2xl sm:text-3xl font-bold text-white leading-tight">
                {featured.name}
              </h3>
              {featured.description && (
                <p className="mt-3 text-sm sm:text-base text-gray-300 leading-relaxed">
                  {featured.description}
                </p>
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={featuredWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm sm:text-base font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Pedir no WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => onSelectProduct(featured)}
                  className="min-h-[48px] bg-white/5 hover:bg-white/10 border border-white/15 text-white font-['Oswald'] uppercase text-sm sm:text-base font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 no-scrollbar">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="w-[68vw] max-w-[250px] md:w-auto md:max-w-none shrink-0 snap-start"
              >
                <ProductCard
                  product={product}
                  index={index}
                  onView={onSelectProduct}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
