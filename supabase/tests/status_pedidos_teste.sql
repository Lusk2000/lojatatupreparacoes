-- Testa a mudança de situação pelo admin. NÃO altera nada: termina em erro de propósito.
-- Resultado esperado: a mensagem "OK: situação passou".

begin;

do $$
declare
  v_admin uuid;
  v_slug text;
  v_a uuid;
  v_b uuid;
  v_stock integer;
  v_status text;
  v_next text;
  v_addr jsonb := '{"zip_code":"30000000","street":"Rua A","number":"1","district":"Centro","city":"BH","state":"MG"}';
  v_items jsonb;
begin
  select user_id into v_admin from public.staff_roles limit 1;
  if v_admin is null then raise exception 'FALHOU: nenhum administrador cadastrado'; end if;

  update public.customers set full_name = 'Teste', cpf_cnpj = '52998224725', phone = '31999999999' where id = v_admin;
  update public.orders set status = 'cancelled' where customer_id = v_admin and status = 'awaiting_payment';
  select slug into v_slug from public.products order by slug limit 1;
  update public.products set price_cents = 1000, stock = 10, active = true, on_quote = false where slug = v_slug;
  v_items := jsonb_build_array(jsonb_build_object('slug', v_slug, 'quantity', 2));

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_a := (public.create_order(v_items, v_addr, gen_random_uuid()) ->> 'id')::uuid;
  v_b := (public.create_order(v_items, v_addr, gen_random_uuid()) ->> 'id')::uuid;

  -- 1. Não pula etapas.
  foreach v_next in array array['shipped', 'delivered', 'refunded', 'cancelled', 'awaiting_payment'] loop
    begin
      perform public.admin_set_order_status(v_a, v_next);
      raise exception 'não deu erro';
    exception when others then
      if sqlerrm <> 'mudanca_invalida' then raise exception 'FALHOU: aguardando -> %, veio "%"', v_next, sqlerrm; end if;
    end;
  end loop;

  -- 2. Caminho normal.
  foreach v_next in array array['paid', 'invoiced', 'shipped', 'delivered'] loop
    perform public.admin_set_order_status(v_a, v_next);
  end loop;
  select status into v_status from public.orders where id = v_a;
  if v_status <> 'delivered' then raise exception 'FALHOU: situação final %', v_status; end if;

  -- 3. Estorno depois do envio não mexe no estoque.
  select stock into v_stock from public.products where slug = v_slug;
  perform public.admin_set_order_status(v_a, 'refunded');
  if (select stock from public.products where slug = v_slug) <> v_stock then
    raise exception 'FALHOU: estorno após envio mexeu no estoque';
  end if;

  -- 4. Estorno antes do envio devolve o estoque, uma única vez.
  perform public.admin_set_order_status(v_b, 'paid');
  perform public.admin_set_order_status(v_b, 'refunded');
  begin
    perform public.admin_set_order_status(v_b, 'refunded');
    raise exception 'não deu erro';
  exception when others then
    if sqlerrm <> 'mudanca_invalida' then raise exception 'FALHOU: estorno repetido, veio "%"', sqlerrm; end if;
  end;
  if (select stock from public.products where slug = v_slug) <> v_stock + 2 then
    raise exception 'FALHOU: estoque após estorno antes do envio';
  end if;

  -- 5. Quem não é da equipe não muda nada.
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid())::text, true);
  begin
    perform public.admin_set_order_status(v_a, 'paid');
    raise exception 'não deu erro';
  exception when others then
    if sqlerrm <> 'sem_permissao' then raise exception 'FALHOU: cliente comum, veio "%"', sqlerrm; end if;
  end;

  reset role;
  set local role anon;
  begin
    perform public.admin_set_order_status(v_a, 'paid');
    raise exception 'não deu erro';
  exception when others then
    if position('permission denied' in sqlerrm) = 0 then raise exception 'FALHOU: anônimo, veio "%"', sqlerrm; end if;
  end;

  raise exception 'OK: situação passou (nada foi alterado)';
end $$;

rollback;
