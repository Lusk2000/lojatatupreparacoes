-- Cancela pedidos que ficaram 3 dias aguardando pagamento e devolve o estoque.
-- Rode uma vez, inteiro, em Supabase > SQL Editor (depois do SQL de pedidos).
-- Quando o pagamento entrar, o prazo passa a seguir o vencimento do Pix/boleto.

begin;

create or replace function public.expire_orders()
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_ids uuid[];
begin
  with expired as (
    update public.orders set status = 'cancelled'
    where status = 'awaiting_payment' and created_at < now() - interval '3 days'
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_ids from expired;

  -- Mesma ordem de bloqueio de create_order, para não haver impasse.
  perform 1 from public.products
    where id in (select product_id from public.order_items where order_id = any (v_ids))
    order by id for update;

  update public.products p set stock = coalesce(p.stock, 0) + i.quantity
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = any (v_ids) group by product_id
  ) i
  where p.id = i.product_id;

  return cardinality(v_ids);
end $$;

-- Só o agendamento do banco chama esta função.
revoke execute on function public.expire_orders() from public, anon, authenticated;

-- agendamento (pg_cron)
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
-- A cada hora, no minuto 15. Repetir com o mesmo nome só atualiza o agendamento.
select cron.schedule('expirar-pedidos', '15 * * * *', 'select public.expire_orders()');

commit;

-- Conferência: deve aparecer uma linha com active = true.
select jobname, schedule, active from cron.job where jobname = 'expirar-pedidos';
