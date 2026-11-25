import React, { useCallback, useEffect, useState } from 'react';
import { clearCatalogCache } from '../../lib/catalog';
import { formatCents } from '../../lib/money';
import { Address, cancelOrder, setOrderStatus, STATUS_LABELS } from '../../lib/orders';
import { supabase } from '../../lib/supabase';

interface AdminOrder {
  id: string;
  number: number;
  status: string;
  total_cents: number;
  created_at: string;
  shipping_address: Address;
  customers: { full_name: string; email: string; phone: string; cpf_cnpj: string } | null;
  order_items: { id: string; product_name: string; quantity: number; unit_price_cents: number }[];
}

// Próximas situações permitidas. O banco confere de novo (admin_set_order_status).
const NEXT: Record<string, { status: string; label: string; confirm?: string }[]> = {
  awaiting_payment: [
    { status: 'paid', label: 'Marcar como pago', confirm: 'Confirme que o dinheiro foi recebido.' },
    { status: 'cancelled', label: 'Cancelar', confirm: 'Cancelar o pedido e devolver o estoque?' },
  ],
  paid: [
    { status: 'invoiced', label: 'Nota emitida' },
    { status: 'shipped', label: 'Enviado' },
    { status: 'refunded', label: 'Estornar', confirm: 'O estoque volta. O dinheiro deve ser devolvido por você.' },
  ],
  invoiced: [
    { status: 'shipped', label: 'Enviado' },
    { status: 'refunded', label: 'Estornar', confirm: 'O estoque volta. Devolva o dinheiro e trate a nota fiscal.' },
  ],
  shipped: [
    { status: 'delivered', label: 'Entregue' },
    { status: 'refunded', label: 'Estornar', confirm: 'O estoque NÃO volta sozinho. Devolva o dinheiro por fora.' },
  ],
  delivered: [
    { status: 'refunded', label: 'Estornar', confirm: 'O estoque NÃO volta sozinho. Devolva o dinheiro por fora.' },
  ],
};

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    let query = supabase
      .from('orders')
      .select(
        'id,number,status,total_cents,created_at,shipping_address,' +
          'customers(full_name,email,phone,cpf_cnpj),order_items(id,product_name,quantity,unit_price_cents)'
      )
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter) query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) return setMessage('Não foi possível carregar os pedidos.');
    setOrders(data as unknown as AdminOrder[]);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (order: AdminOrder, step: (typeof NEXT)[string][number]) => {
    if (!supabase) return;
    if (step.confirm && !window.confirm(`Pedido ${order.number}: ${step.confirm}`)) return;
    setBusyId(order.id);
    setMessage('');
    try {
      if (step.status === 'cancelled') await cancelOrder(supabase, order.id);
      else await setOrderStatus(supabase, order.id, step.status);
      // Cancelar e estornar mudam o estoque mostrado na loja.
      clearCatalogCache();
      setMessage(`Pedido ${order.number}: ${STATUS_LABELS[step.status]}.`);
    } catch (err) {
      setMessage((err as Error).message);
    }
    // Relê sempre: o pedido pode ter mudado (expiração, outro administrador).
    await load();
    setBusyId('');
  };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold uppercase">Pedidos</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <select aria-label="Filtrar por situação" value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-[#181818] border border-white/15 rounded-xl">
          <option value="">Todas as situações</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="button" onClick={load} className="text-sm underline text-gray-300 hover:text-white">
          Atualizar
        </button>
      </div>

      {message && <p role="status" className="text-sm text-amber-300">{message}</p>}
      {!orders && !message && <p className="text-gray-400">Carregando...</p>}
      {orders?.length === 0 && <p className="text-gray-400">Nenhum pedido.</p>}

      <ul className="space-y-4">
        {orders?.map((order) => {
          const a = order.shipping_address;
          const c = order.customers;
          return (
            <li key={order.id} className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-2 font-semibold">
                <span>Pedido {order.number} · {new Date(order.created_at).toLocaleString('pt-BR')}</span>
                <span>{STATUS_LABELS[order.status] ?? order.status} · {formatCents(order.total_cents)}</span>
              </div>
              <ul className="text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.product_name} · {formatCents(item.unit_price_cents)} cada
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                <p>
                  {c?.full_name || 'Cliente sem nome'}<br />
                  CPF/CNPJ: {c?.cpf_cnpj}<br />
                  {c?.phone} · {c?.email}
                </p>
                <p>
                  {a.street}, {a.number}{a.complement ? ` · ${a.complement}` : ''}<br />
                  {a.district} · {a.city}/{a.state}<br />
                  CEP {a.zip_code}
                </p>
              </div>
              {NEXT[order.status] && (
                <div className="flex flex-wrap gap-2">
                  {NEXT[order.status].map((step) => (
                    <button key={step.status} type="button" disabled={busyId !== ''}
                      onClick={() => change(order, step)}
                      className="px-4 py-2 rounded-lg border border-white/15 text-sm hover:bg-white/10 disabled:opacity-50">
                      {step.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OrderList;
