import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import FormField, { primaryButtonClass } from '../components/FormField';
import { useCatalog } from '../hooks/useCatalog';
import { useAuth } from '../lib/auth';
import { resolveCart } from '../lib/cart';
import { useCart } from '../lib/cartContext';
import { clearCatalogCache } from '../lib/catalog';
import { formatCents } from '../lib/money';
import { Address, createOrder, EMPTY_ADDRESS } from '../lib/orders';
import { supabase } from '../lib/supabase';

const CheckoutPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const catalog = useCatalog();
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [profileOk, setProfileOk] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clientRef] = useState(() => crypto.randomUUID());
  // Depois do pedido o carrinho esvazia antes de a página trocar.
  const isPlaced = useRef(false);

  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;
    let isCancelled = false;
    (async () => {
      const [customer, last] = await Promise.all([
        client.from('customers').select('full_name,cpf_cnpj,phone').eq('id', userId).single(),
        client.from('orders').select('shipping_address').eq('customer_id', userId)
          .order('created_at', { ascending: false }).limit(1),
      ]);
      if (isCancelled) return;
      const data = customer.data;
      // Se a leitura falhar, o banco ainda confere o cadastro no envio.
      setProfileOk(!data || Boolean(data.full_name && data.cpf_cnpj && data.phone));
      // Repete o endereço do último pedido, sem apagar o que já foi digitado.
      const previous = last.data?.[0]?.shipping_address as Address | undefined;
      if (previous) setAddress((current) => (current.zip_code || current.street ? current : { ...EMPTY_ADDRESS, ...previous }));
    })();
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (isLoading) return <PageLayout><p className="text-gray-400">Carregando...</p></PageLayout>;
  if (!user || !supabase) return <Navigate to="/entrar" replace state={{ from: '/checkout' }} />;
  if (!catalog || profileOk === null) return <PageLayout><p className="text-gray-400">Carregando...</p></PageLayout>;
  const client = supabase;
  const cart = resolveCart(items, catalog.products);
  // Item indisponível ou acima do estoque é resolvido no carrinho.
  const needsReview = cart.lines.some(
    (line) => !line.available || items.some((i) => i.slug === line.slug && i.quantity !== line.quantity)
  );
  if (!isPlaced.current && (cart.lines.length === 0 || needsReview)) return <Navigate to="/carrinho" replace />;

  const bind = (field: keyof Address) => ({
    name: field,
    value: address[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddress((prev) => ({ ...prev, [field]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');
    try {
      const number = await createOrder(client, items, address, clientRef);
      clearCatalogCache();
      isPlaced.current = true;
      navigate('/minha-conta', { replace: true, state: { newOrder: number } });
      clear();
    } catch (err) {
      // O estoque pode ter mudado: o carrinho relê o catálogo.
      clearCatalogCache();
      setMessage((err as Error).message);
      setIsSending(false);
    }
  };

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold uppercase mb-6">Finalizar pedido</h1>
      {!profileOk && (
        <p className="mb-6 text-amber-300">
          Antes de continuar, complete seus dados em <Link to="/minha-conta" className="underline">Minha conta</Link>.
        </p>
      )}
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <fieldset className="space-y-4">
          <legend className="text-xl font-bold uppercase mb-4">Endereço de entrega</legend>
          <FormField label="CEP" required inputMode="numeric" autoComplete="postal-code" {...bind('zip_code')} />
          <FormField label="Rua" required autoComplete="address-line1" {...bind('street')} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Número" required {...bind('number')} />
            <FormField label="Complemento" {...bind('complement')} />
          </div>
          <FormField label="Bairro" required {...bind('district')} />
          <div className="grid grid-cols-[1fr_6rem] gap-4">
            <FormField label="Cidade" required autoComplete="address-level2" {...bind('city')} />
            <FormField label="UF" required maxLength={2} autoComplete="address-level1" {...bind('state')} />
          </div>
        </fieldset>

        <section className="space-y-4">
          <h2 className="text-xl font-bold uppercase">Seu pedido</h2>
          <ul className="space-y-2 text-sm">
            {cart.lines.map((line) => (
              <li key={line.slug} className="flex justify-between gap-4">
                <span>{line.quantity}x {line.product!.name}</span>
                <span>{formatCents(line.totalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3">
            <span>Total sem frete</span>
            <span>{formatCents(cart.subtotalCents)}</span>
          </div>
          <p className="text-sm text-gray-400">
            O pagamento pelo site ainda está sendo preparado. O pedido fica aguardando pagamento, e o frete
            será combinado. Sem pagamento em 3 dias, o pedido é cancelado automaticamente.
          </p>
          {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
          <button type="submit" disabled={isSending || !profileOk} className={primaryButtonClass}>
            {isSending ? 'Enviando...' : 'Fazer pedido'}
          </button>
          <Link to="/carrinho" className="block text-center text-sm text-gray-300 underline">Voltar ao carrinho</Link>
        </section>
      </form>
    </PageLayout>
  );
};

export default CheckoutPage;
