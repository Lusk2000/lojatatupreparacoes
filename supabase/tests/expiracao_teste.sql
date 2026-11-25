-- Testa a expiração de pedidos. NÃO altera nada: termina em erro de propósito.
-- Resultado esperado: a mensagem "OK: expiração passou".

begin;

do $$
declare
  v_user uuid;
  v_slug text;
  v_old uuid;
  v_new uuid;
  v_stock integer;
  v_status text;
  v_addr jsonb := '{"zip_code":"30000000","street":"Rua A","number":"1","district":"Centro","city":"BH","state":"MG"}';
  v_items jsonb;
begin
  select user_id into v_user from public.staff_roles limit 1;
  if v_user is null then raise exception 'FALHOU: nenhum administrador cadastrado'; end if;

  update public.customers set full_name = 'Teste', cpf_cnpj = '52998224725', phone = '31999999999' where id = v_user;
  update public.orders set status = 'cancelled' where status = 'awaiting_payment';
  select slug into v_slug from public.products order by slug limit 1;
  update public.products set price_cents = 1000, stock = 5, active = true, on_quote = false where slug = v_slug;
  v_items := jsonb_build_array(jsonb_build_object('slug', v_slug, 'quantity', 2));

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  v_old := (public.create_order(v_items, v_addr, gen_random_uuid()) ->> 'id')::uuid;
  v_new := (public.create_order(
    jsonb_build_array(jsonb_build_object('slug', v_slug, 'quantity', 1)), v_addr, gen_random_uuid()) ->> 'id')::uuid;
  update public.orders set created_at = now() - interval '3 days 1 minute' where id = v_old;
  update public.orders set created_at = now() - interval '2 days 23 hours' where id = v_new;

  if public.expire_orders() <> 1 then raise exception 'FALHOU: quantidade expirada'; end if;
  select status into v_status from public.orders where id = v_old;
  if v_status <> 'cancelled' then raise exception 'FALHOU: pedido vencido ficou %', v_status; end if;
  select status into v_status from public.orders where id = v_new;
  if v_status <> 'awaiting_payment' then raise exception 'FALHOU: pedido recente ficou %', v_status; end if;
  select stock into v_stock from public.products where slug = v_slug;
  if v_stock <> 4 then raise exception 'FALHOU: estoque = % (esperado 4)', v_stock; end if;

  if public.expire_orders() <> 0 then raise exception 'FALHOU: expirou de novo'; end if;
  select stock into v_stock from public.products where slug = v_slug;
  if v_stock <> 4 then raise exception 'FALHOU: estoque devolvido duas vezes'; end if;

  set local role authenticated;
  begin
    perform public.expire_orders();
    raise exception 'não deu erro';
  exception when others then
    if position('permission denied' in sqlerrm) = 0 then raise exception 'FALHOU: cliente executou, veio "%"', sqlerrm; end if;
  end;

  raise exception 'OK: expiração passou (nada foi alterado)';
end $$;

rollback;
