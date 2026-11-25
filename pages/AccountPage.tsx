import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import FormField, { primaryButtonClass } from '../components/FormField';
import { useAuth } from '../lib/auth';
import { clearCatalogCache } from '../lib/catalog';
import { cancelOrder, STATUS_LABELS } from '../lib/orders';
import { isValidDocument, normalizeDocument } from '../lib/documents';
import { supabase } from '../lib/supabase';

interface OrderSummary {
  id: string;
  number: number;
  status: string;
  total_cents: number;
  created_at: string;
  order_items: { id: string; product_name: string; quantity: number }[];
}

const AccountPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState({ full_name: '', cpf_cnpj: '', phone: '' });
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const newOrder = (useLocation().state as { newOrder?: number } | null)?.newOrder;

  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;
    let isCancelled = false;
    // Só decide se o link aparece. O acesso ao admin é conferido lá e no banco.
    setIsStaff(false);
    client.rpc('is_staff').then(({ data }) => {
      if (!isCancelled) setIsStaff(data === true);
    });
    (async () => {
      const [customer, history] = await Promise.all([
        client.from('customers').select('full_name,cpf_cnpj,phone').eq('id', userId).single(),
        client
          .from('orders')
          .select('id,number,status,total_cents,created_at,order_items(id,product_name,quantity)')
          .eq('customer_id', userId)
          .order('created_at', { ascending: false }),
      ]);
      if (isCancelled) return;
      if (customer.data) setProfile(customer.data);
      if (history.data) setOrders(history.data as OrderSummary[]);
      if (customer.error || history.error) setMessage('Não foi possível carregar seus dados.');
    })();
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (isLoading) return <PageLayout><p className="text-gray-400">Carregando...</p></PageLayout>;
  if (!user || !supabase) return <Navigate to="/entrar" replace state={{ from: '/minha-conta' }} />;
  const client = supabase;

  const bind = (field: keyof typeof profile) => ({
    name: field,
    required: true,
    value: profile[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfile((prev) => ({ ...prev, [field]: e.target.value })),
  });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDocument(profile.cpf_cnpj)) return setMessage('CPF ou CNPJ inválido.');
    const { error } = await client
      .from('customers')
      .update({ ...profile, cpf_cnpj: normalizeDocument(profile.cpf_cnpj) })
      .eq('id', user.id);
    setMessage(error ? 'Não foi possível salvar.' : 'Dados salvos.');
  };

  const cancel = async (order: OrderSummary) => {
    if (!window.confirm(`Cancelar o pedido ${order.number}?`)) return;
    try {
      await cancelOrder(client, order.id);
      clearCatalogCache();
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)));
      setMessage(`Pedido ${order.number} cancelado.`);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await client.auth.updateUser({ password });
    if (!error) setPassword('');
    setMessage(error ? 'Não foi possível alterar a senha.' : 'Senha alterada.');
  };

  return (
    <PageLayout>
      <div className="space-y-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold uppercase">Minha conta</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <button type="button" onClick={() => client.auth.signOut()}
            className="text-sm text-gray-300 hover:text-white underline">
            Sair
          </button>
        </div>

        {isStaff && (
          <Link to="/admin" className={`${primaryButtonClass} inline-block text-center`}>
            Administração
          </Link>
        )}

        {newOrder && (
          <p role="status" className="text-green-400">
            Pedido {newOrder} registrado. Ele aguarda pagamento.
          </p>
        )}

        {message && <p role="status" className="text-sm text-amber-300">{message}</p>}

        <section>
          <h2 className="text-xl font-bold uppercase mb-4">Meus pedidos</h2>
          {orders.length === 0 ? (
            <p className="text-gray-400">Você ainda não tem pedidos.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="bg-[#181818] border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between gap-4 font-semibold">
                    <span>Pedido {order.number} · {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                    <span>
                      {(order.total_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {STATUS_LABELS[order.status] ?? order.status}
                    {order.status === 'awaiting_payment' && ' · cancelado automaticamente após 3 dias'}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {order.order_items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                  </p>
                  {order.status === 'awaiting_payment' && (
                    <button type="button" onClick={() => cancel(order)}
                      className="mt-2 text-sm text-gray-400 underline hover:text-white">
                      Cancelar pedido
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={saveProfile} className="space-y-4">
            <h2 className="text-xl font-bold uppercase">Meus dados</h2>
            <FormField label="Nome completo ou razão social" {...bind('full_name')} />
            <FormField label="CPF ou CNPJ" {...bind('cpf_cnpj')} />
            <FormField label="Telefone com DDD" type="tel" {...bind('phone')} />
            <button type="submit" className={primaryButtonClass}>Salvar</button>
          </form>
          <form onSubmit={changePassword} className="space-y-4">
            <h2 className="text-xl font-bold uppercase">Alterar senha</h2>
            <FormField label="Nova senha (mínimo 8 caracteres)" name="new_password" type="password" required
              minLength={8} autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className={primaryButtonClass}>Alterar senha</button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default AccountPage;
