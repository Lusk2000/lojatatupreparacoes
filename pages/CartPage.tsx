import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ProductImage from '../components/ProductImage';
import { primaryButtonClass } from '../components/FormField';
import { useCatalog } from '../hooks/useCatalog';
import { resolveCart } from '../lib/cart';
import { useCart } from '../lib/cartContext';
import { formatCents } from '../lib/money';
import { productSlug } from '../lib/productShare';

const stepClass =
  'w-10 h-10 rounded-lg border border-white/15 text-lg hover:bg-white/10 disabled:opacity-40';

const CartPage: React.FC = () => {
  const catalog = useCatalog();
  const { items, update } = useCart();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const cart = catalog ? resolveCart(items, catalog.products) : null;

  // Estoque menor que o guardado: acerta o carrinho para o contador bater.
  const clamped = cart?.lines.find(
    (line) => line.available && items.some((i) => i.slug === line.slug && i.quantity > line.quantity)
  );
  useEffect(() => {
    if (!clamped) return;
    update(clamped.slug, clamped.quantity);
    setMessage('Ajustamos a quantidade ao estoque disponível.');
  }, [clamped?.slug, clamped?.quantity]);

  if (!cart) return <PageLayout><p className="text-gray-400">Carregando...</p></PageLayout>;

  if (cart.lines.length === 0) {
    return (
      <PageLayout>
        <h1 className="text-3xl font-bold uppercase mb-3">Carrinho</h1>
        <p className="text-gray-400 mb-3">Seu carrinho está vazio.</p>
        <Link to="/" className="underline text-gray-300">Ver produtos</Link>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold uppercase mb-6">Carrinho</h1>
      <ul className="space-y-3">
        {cart.lines.map((line) => {
          const name = line.product?.name ?? line.slug;
          return (
            <li key={line.slug} className="bg-[#181818] border border-white/10 rounded-xl p-4 flex flex-wrap gap-4 items-center">
              {line.product && (
                <ProductImage src={line.product.image} alt="" className="w-16 h-16 object-cover rounded-lg" />
              )}
              <div className="flex-1 min-w-[160px]">
                {line.product ? (
                  <Link to={`/produto/${productSlug(line.product)}`} className="font-semibold hover:underline">{name}</Link>
                ) : (
                  <span className="font-semibold">{name}</span>
                )}
                <p className="text-sm text-gray-400">
                  {line.available ? formatCents(line.product!.priceCents!) : 'Indisponível no momento'}
                </p>
              </div>
              {line.available && (
                <div className="flex items-center gap-2">
                  <button type="button" className={stepClass} aria-label={`Diminuir ${name}`}
                    disabled={line.quantity <= 1} onClick={() => update(line.slug, line.quantity - 1)}>−</button>
                  <span className="w-8 text-center" aria-label="Quantidade">{line.quantity}</span>
                  <button type="button" className={stepClass} aria-label={`Aumentar ${name}`}
                    disabled={line.quantity >= line.product!.stock!}
                    onClick={() => update(line.slug, line.quantity + 1)}>+</button>
                </div>
              )}
              <p className="w-28 text-right font-semibold">{line.available ? formatCents(line.totalCents) : '—'}</p>
              <button type="button" onClick={() => update(line.slug, 0)}
                className="text-sm text-gray-400 underline hover:text-white">Remover</button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 ml-auto max-w-sm space-y-3">
        <div className="flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatCents(cart.subtotalCents)}</span>
        </div>
        <p className="text-sm text-gray-400">O frete ainda não está incluído.</p>
        {cart.lines.some((line) => !line.available) && (
          <p className="text-sm text-amber-300">Remova os itens indisponíveis para continuar.</p>
        )}
        {message && <p role="status" className="text-sm text-amber-300">{message}</p>}
        <button type="button" onClick={() => navigate('/checkout')}
          disabled={cart.count === 0 || cart.lines.some((line) => !line.available)}
          className={primaryButtonClass}>
          Finalizar compra
        </button>
        <Link to="/" className="block text-center text-sm text-gray-300 underline">Continuar comprando</Link>
      </div>
    </PageLayout>
  );
};

export default CartPage;
