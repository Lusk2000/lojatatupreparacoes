// Criação e cancelamento de pedidos. As regras ficam nas funções do banco
// (supabase/migrations/20261127000000_pedidos.sql).
import { SupabaseClient } from '@supabase/supabase-js';
import { CartItem } from './cart';

export interface Address {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export const EMPTY_ADDRESS: Address = {
  zip_code: '', street: '', number: '', complement: '', district: '', city: '', state: '',
};

export const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  invoiced: 'Nota emitida',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
};

const MESSAGES: Record<string, string> = {
  nao_autenticado: 'Sua sessão expirou. Entre novamente.',
  cadastro_incompleto: 'Complete nome, CPF/CNPJ e telefone em Minha conta.',
  muitos_pedidos_abertos: 'Você já tem 3 pedidos aguardando pagamento. Cancele um em Minha conta.',
  endereco_invalido: 'Confira o endereço: CEP com 8 números e estado com 2 letras.',
  sem_estoque: 'Não há estoque suficiente de um produto. Volte ao carrinho.',
  produto_indisponivel: 'Um produto do carrinho não está mais à venda. Volte ao carrinho.',
  nao_cancelavel: 'Este pedido não pode mais ser cancelado.',
  mudanca_invalida: 'O pedido mudou de situação. Confira a lista.',
  sem_permissao: 'Sua conta não tem permissão de administrador.',
};

const toMessage = (error: { message: string; code?: string }): string =>
  // PGRST202: a função ainda não existe no banco.
  error.code === 'PGRST202'
    ? 'Esta função ainda não está ativa no banco. Rode o SQL no Supabase.'
    : MESSAGES[error.message] ?? 'Não foi possível concluir agora. Tente novamente.';

// clientRef identifica a tentativa: reenviar não cria um segundo pedido.
export const createOrder = async (
  client: SupabaseClient,
  items: CartItem[],
  address: Address,
  clientRef: string
): Promise<number> => {
  const { data, error } = await client.rpc('create_order', {
    p_items: items.map(({ slug, quantity }) => ({ slug, quantity })),
    p_address: address,
    p_client_ref: clientRef,
  });
  if (error) throw new Error(toMessage(error));
  return (data as { number: number }).number;
};

export const cancelOrder = async (client: SupabaseClient, orderId: string): Promise<void> => {
  const { error } = await client.rpc('cancel_order', { p_order_id: orderId });
  if (error) throw new Error(toMessage(error));
};

export const setOrderStatus = async (client: SupabaseClient, orderId: string, status: string): Promise<void> => {
  const { error } = await client.rpc('admin_set_order_status', { p_order_id: orderId, p_status: status });
  if (error) throw new Error(toMessage(error));
};
