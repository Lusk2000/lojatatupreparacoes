import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './Icons';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCatalog } from '../hooks/useCatalog';
import { normalizeCompactText, normalizeText } from '../lib/utils';

const PRODUCTS_PER_PAGE = 8;

interface ProductSectionProps {
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelectProduct: (product: Product) => void;
}

const matchesProductQuery = (product: Product, rawQuery: string): boolean => {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  const fullText = `${product.name} ${product.category} ${product.description ?? ''}`;
  const searchable = normalizeText(fullText);
  const compactSearchable = normalizeCompactText(fullText);

  const tokens = normalizeText(trimmed).split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    const compactToken = token.replace(/[^a-z0-9]/g, '');
    return (
      searchable.includes(token) ||
      (compactToken.length > 0 && compactSearchable.includes(compactToken))
    );
  });
};

const ProductSection: React.FC<ProductSectionProps> = ({ searchInputRef, onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [visibleProductsCount, setVisibleProductsCount] = useState(PRODUCTS_PER_PAGE);
  const catalog = useCatalog();
  const products = useMemo(() => catalog?.products ?? [], [catalog]);
  const categories = useMemo(() => ['Todos', ...(catalog?.categories ?? [])], [catalog]);
  const isLoading = catalog === null;
  const localInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = searchInputRef ?? localInputRef;
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const { containerRef: titleRef, animationClasses: titleAnimation } = useScrollReveal<HTMLDivElement>();

  const searchMatchedProducts = useMemo(
    () => products.filter((product) => matchesProductQuery(product, deferredSearchTerm)),
    [deferredSearchTerm, products]
  );

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todos') return searchMatchedProducts;
    return searchMatchedProducts.filter((product) => product.category === selectedCategory);
  }, [searchMatchedProducts, selectedCategory]);

  const categoryMatchCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: searchMatchedProducts.length };
    for (const product of searchMatchedProducts) {
      counts[product.category] = (counts[product.category] || 0) + 1;
    }
    return counts;
  }, [searchMatchedProducts]);

  useEffect(() => {
    setVisibleProductsCount(PRODUCTS_PER_PAGE);
  }, [deferredSearchTerm, selectedCategory]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleProductsCount),
    [filteredProducts, visibleProductsCount]
  );

  const remainingCount = Math.max(0, filteredProducts.length - visibleProducts.length);

  const handleShowMore = () => {
    setVisibleProductsCount((prev) => prev + PRODUCTS_PER_PAGE);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    activeInputRef.current?.focus();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todos');
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 220;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const isSearching = searchTerm.trim().length > 0;
  const hasActiveFilters = isSearching || selectedCategory !== 'Todos';

  return (
    <section id="produtos" className="py-12 sm:py-20 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className={`text-left sm:text-center mb-8 sm:mb-10 ${titleAnimation}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase font-['Oswald'] text-white [text-wrap:balance]">
            Catálogo de <span className="text-[#E10600]">Produtos</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl sm:mx-auto">
            Filtre por caminhonete ou busque diretamente pela peça ou kit que você precisa.
          </p>
        </div>

        <div className="mb-8 sm:mb-10 space-y-5">
          <div className="max-w-xl sm:mx-auto">
            <label
              htmlFor="catalog-search"
              className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Buscar peças, kits ou modelos
            </label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={activeInputRef}
                id="catalog-search"
                type="search"
                autoComplete="off"
                placeholder="Ex: F-250, Silverado, turbina, embreagem..."
                className="block w-full min-h-[48px] pl-11 pr-12 py-3 bg-[#181818] border border-white/15 rounded-xl focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-white text-base placeholder-gray-500 transition-colors outline-none [&::-webkit-search-cancel-button]:hidden"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && searchTerm) {
                    e.preventDefault();
                    setSearchTerm('');
                  }
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg"
                  aria-label="Limpar busca"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="hidden md:flex shrink-0 items-center justify-center w-11 h-11 bg-[#181818] hover:bg-[#222222] rounded-xl text-gray-300 hover:text-white border border-white/10 transition-colors"
              aria-label="Rolar categorias para a esquerda"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <div
              ref={categoryScrollRef}
              className="flex overflow-x-auto gap-2 py-1 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar scroll-smooth snap-x"
              role="tablist"
              aria-label="Filtrar por categoria"
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                const matchCount = categoryMatchCounts[category] ?? 0;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(category)}
                    className={`snap-start whitespace-nowrap shrink-0 min-h-[44px] px-4 py-2 rounded-xl text-sm font-['Oswald'] uppercase tracking-wider transition-colors duration-150 border inline-flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#E10600] text-white border-[#E10600] font-semibold'
                        : 'bg-[#181818] text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span>{category}</span>
                    {isSearching && (
                      <span
                        className={`text-xs font-sans tabular-nums ${
                          isSelected ? 'text-white/90' : 'text-gray-400'
                        }`}
                      >
                        ({matchCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="hidden md:flex shrink-0 items-center justify-center w-11 h-11 bg-[#181818] hover:bg-[#222222] rounded-xl text-gray-300 hover:text-white border border-white/10 transition-colors"
              aria-label="Rolar categorias para a direita"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {!isLoading && (
            <div
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-400 border-b border-white/10 pb-3"
            >
              <span className="tabular-nums">
                Exibindo <strong className="text-white">{visibleProducts.length}</strong> de{' '}
                <strong className="text-white">{filteredProducts.length}</strong>{' '}
                {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                {isSearching && (
                  <>
                    {' '}
                    para <strong className="text-white">&ldquo;{searchTerm.trim()}&rdquo;</strong>
                  </>
                )}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[#E10600] hover:underline font-medium py-1 px-2 -mr-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#181818] border border-white/10 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 bg-white/10 rounded" />
                  <div className="h-5 w-4/5 bg-white/10 rounded" />
                  <div className="h-10 w-full bg-white/10 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onView={onSelectProduct}
                  searchQuery={deferredSearchTerm}
                  instantAppear={hasActiveFilters}
                />
              ))}
            </div>

            {remainingCount > 0 && (
              <div className="mt-8 sm:mt-12 text-center">
                <button
                  type="button"
                  onClick={handleShowMore}
                  className="w-full sm:w-auto min-h-[48px] bg-transparent border-2 border-[#E10600] text-white hover:bg-[#E10600] font-['Oswald'] uppercase text-base font-bold py-3 px-8 rounded-xl transition-colors duration-150 tabular-nums"
                >
                  Carregar Mais ({remainingCount} restantes)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-14 px-4 bg-[#181818] rounded-2xl border border-white/10">
            <p className="text-lg font-medium text-white">
              Nenhum produto encontrado nesta seleção.
            </p>
            {selectedCategory !== 'Todos' && searchMatchedProducts.length > 0 ? (
              <>
                <p className="text-sm text-gray-400 mt-1 tabular-nums">
                  Encontramos{' '}
                  <strong className="text-white">{searchMatchedProducts.length}</strong>{' '}
                  {searchMatchedProducts.length === 1 ? 'item compatível' : 'itens compatíveis'} em
                  outras categorias.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('Todos')}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm font-semibold rounded-xl transition-colors"
                  >
                    Ver em Todos ({searchMatchedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-['Oswald'] uppercase text-sm font-medium rounded-xl transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mt-1">
                  Tente outro termo ou selecione todas as categorias.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 min-h-[44px] px-6 py-2.5 bg-[#E10600] hover:bg-red-700 text-white font-['Oswald'] uppercase text-sm font-semibold rounded-xl transition-colors"
                >
                  Limpar filtros
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
