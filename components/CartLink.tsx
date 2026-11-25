import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../lib/cartContext';

const CartLink: React.FC = () => {
  const { count } = useCart();

  return (
    <Link to="/carrinho" aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className="relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 4h2l2.4 11.2a1 1 0 001 .8h8.8a1 1 0 001-.8L20 8H6M9 20h.01M17 20h.01" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E10600] text-white text-[11px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
};

export default CartLink;
