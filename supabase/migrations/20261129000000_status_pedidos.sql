-- Mudança de situação do pedido pelo admin.
-- Rode uma vez, inteiro, em Supabase > SQL Editor (depois do SQL de pedidos).
--
-- Cancelar um pedido ainda não pago continua sendo feito por cancel_order.
-- "Estornado" só registra a situação: a devolução do dinheiro é feita à parte.

begin;

create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_current text;
begin
  if not public.is_staff() then raise exception 'sem_permissao'; end if;

  select status into v_current from public.orders where id = p_order_id for update;

  -- coalesce: pedido inexistente ou situação nula também são recusados.
  if not coalesce(
    (v_current = 'awaiting_payment' and p_status = 'paid')
    or (v_current = 'paid' and p_status in ('invoiced', 'shipped', 'refunded'))
    or (v_current = 'invoiced' and p_status in ('shipped', 'refunded'))
    or (v_current = 'shipped' and p_status in ('delivered', 'refunded'))
    or (v_current = 'delivered' and p_status = 'refunded'),
    false
  ) then
    raise exception 'mudanca_invalida';
  end if;

  update public.orders set status = p_status where id = p_order_id;

  -- Estorno antes do envio: a mercadoria não saiu, o estoque volta.
  -- Depois do envio, o estoque é ajustado à mão quando o produto retornar.
  if p_status = 'refunded' and v_current in ('paid', 'invoiced') then
    perform 1 from public.products
      where id in (select product_id from public.order_items where order_id = p_order_id)
      order by id for update;

    update public.products p set stock = coalesce(p.stock, 0) + i.quantity
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items where order_id = p_order_id group by product_id
    ) i
    where p.id = i.product_id;
  end if;
end $$;

revoke execute on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

commit;
