import React from 'react';
import { Link } from 'react-router-dom';
import { isPurchasable } from '../lib/cart';
import { useCart } from '../lib/cartContext';
import { buildWhatsAppProductUrl } from '../lib/utils';
import { Product } from '../types';
import { WhatsAppIcon } from './Icons';

interface Props {
  product: Product;
  className: string;
  // Texto do botão quando o produto não pode ser comprado pelo site.
  consultLabel: React.ReactNode;
  showCartLink?: boolean;
}

const AddToCartButton: React.FC<Props> = ({ product, className, consultLabel, showCartLink }) => {
  const { items, add } = useCart();

  if (!isPurchasable(product)) {
    return (
      <a href={buildWhatsAppProductUrl(product)} target="_blank" rel="noopener noreferrer" className={className}>
        <WhatsAppIcon className="w-4 h-4 shrink-0" />
        {consultLabel}
      </a>
    );
  }

  const slug = String(product.id);
  const inCart = items.find((i) => i.slug === slug)?.quantity ?? 0;
  const isFull = inCart >= product.stock!;

  return (
    <>
      <button type="button" disabled={isFull} onClick={() => add(slug, product.stock!)}
        className={`${className} disabled:opacity-60`}>
        {isFull ? 'Máximo no carrinho' : inCart ? `Adicionar mais (${inCart})` : 'Adicionar ao carrinho'}
      </button>
      {showCartLink && inCart > 0 && (
        <Link to="/carrinho" className="block text-center text-sm text-gray-300 underline hover:text-white py-1">
          Ver carrinho
        </Link>
      )}
    </>
  );
};

export default AddToCartButton;
