-- Testa a criação e o cancelamento de pedidos. NÃO altera nada: o script sempre
-- termina em erro de propósito, e o banco desfaz tudo.
-- Resultado esperado: a mensagem "OK: todos os testes passaram".
-- Precisa de um administrador já cadastrado (usado como cliente de teste).

begin;

do $$
declare
  v_user uuid;
  v_a text;
  v_b text;
  v_ref uuid := gen_random_uuid();
  v_addr jsonb := '{"zip_code":"30000-000","street":"Rua A","number":"1","district":"Centro","city":"BH","state":"mg"}';
  v_first jsonb;
  v_again jsonb;
  v_error text;
  v_stock integer;

  -- Executa um comando que deve falhar e devolve a mensagem do erro.
  v_sql text;
begin
  select user_id into v_user from public.staff_roles limit 1;
  if v_user is null then raise exception 'FALHOU: nenhum administrador cadastrado'; end if;

  -- Preparação (tudo será desfeito).
  update public.customers set full_name = 'Teste', cpf_cnpj = '52998224725', phone = '31999999999' where id = v_user;
  update public.orders set status = 'cancelled' where customer_id = v_user and status = 'awaiting_payment';
  select slug into v_a from public.products order by slug limit 1;
  select slug into v_b from public.products order by slug offset 1 limit 1;
  update public.products set price_cents = 1000, stock = 5, active = true, on_quote = false where slug in (v_a, v_b);

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1. Pedido normal: total calculado no banco e estoque reservado.
  v_first := public.create_order(
    jsonb_build_array(jsonb_build_object('slug', v_a, 'quantity', 2, 'price', 1)), v_addr, v_ref);
  if (v_first ->> 'total_cents')::int <> 2000 then raise exception 'FALHOU: total %', v_first; end if;
  select stock into v_stock from public.products where slug = v_a;
  if v_stock <> 3 then raise exception 'FALHOU: estoque após pedido = %', v_stock; end if;

  -- 2. Repetir o mesmo envio não duplica.
  v_again := public.create_order(
    jsonb_build_array(jsonb_build_object('slug', v_a, 'quantity', 2)), v_addr, v_ref);
  select stock into v_stock from public.products where slug = v_a;
  if v_again ->> 'id' <> v_first ->> 'id' or v_stock <> 3 then raise exception 'FALHOU: pedido duplicado'; end if;

  -- 3. Erros esperados.
  for v_sql, v_error in
    select * from (values
      (format('select public.create_order(%L, %L, gen_random_uuid())',
        jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', 6)), v_addr), 'sem_estoque'),
      (format('select public.create_order(%L, %L, gen_random_uuid())',
        jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', 3), jsonb_build_object('slug', v_b, 'quantity', 3)), v_addr), 'sem_estoque'),
      (format('select public.create_order(%L, %L, gen_random_uuid())',
        jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', -1)), v_addr), 'pedido_invalido'),
      (format('select public.create_order(%L, %L, gen_random_uuid())', '[]'::jsonb, v_addr), 'pedido_invalido'),
      (format('select public.create_order(%L, %L, gen_random_uuid())',
        jsonb_build_array(jsonb_build_object('slug', 'nao-existe', 'quantity', 1)), v_addr), 'produto_indisponivel'),
      (format('select public.create_order(%L, %L, gen_random_uuid())',
        jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', 1)), v_addr || '{"zip_code":"123"}'), 'endereco_invalido'),
      ('insert into public.orders (customer_id, subtotal_cents, total_cents, shipping_address) values (auth.uid(), 1, 1, ''{}'')',
        'permission denied')
    ) as cases(command, expected)
  loop
    begin
      execute v_sql;
      raise exception 'não deu erro';
    exception when others then
      if position(v_error in sqlerrm) = 0 then
        raise exception 'FALHOU: esperava %, veio "%"', v_error, sqlerrm;
      end if;
    end;
  end loop;
  select stock into v_stock from public.products where slug = v_b;
  if v_stock <> 5 then raise exception 'FALHOU: pedido recusado mexeu no estoque'; end if;

  -- 4. Limite de 3 pedidos aguardando pagamento.
  perform public.create_order(jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', 1)), v_addr, gen_random_uuid());
  perform public.create_order(jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', 1)), v_addr, gen_random_uuid());
  begin
    perform public.create_order(jsonb_build_array(jsonb_build_object('slug', v_b, 'quantity', 1)), v_addr, gen_random_uuid());
    raise exception 'não deu erro';
  exception when others then
    if sqlerrm <> 'muitos_pedidos_abertos' then raise exception 'FALHOU: limite, veio "%"', sqlerrm; end if;
  end;

  -- 5. Outra pessoa não cancela o pedido.
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid())::text, true);
  begin
    perform public.cancel_order((v_first ->> 'id')::uuid);
    raise exception 'não deu erro';
  exception when others then
    if sqlerrm <> 'nao_cancelavel' then raise exception 'FALHOU: cancelamento alheio, veio "%"', sqlerrm; end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user)::text, true);

  -- 6. Cancelar devolve o estoque uma única vez.
  perform public.cancel_order((v_first ->> 'id')::uuid);
  begin
    perform public.cancel_order((v_first ->> 'id')::uuid);
    raise exception 'não deu erro';
  exception when others then
    if sqlerrm <> 'nao_cancelavel' then raise exception 'FALHOU: cancelar duas vezes, veio "%"', sqlerrm; end if;
  end;
  select stock into v_stock from public.products where slug = v_a;
  if v_stock <> 5 then raise exception 'FALHOU: estoque após cancelar = %', v_stock; end if;

  -- 7. Cadastro incompleto é recusado.
  reset role;
  update public.customers set cpf_cnpj = '' where id = v_user;
  set local role authenticated;
  begin
    perform public.create_order(jsonb_build_array(jsonb_build_object('slug', v_a, 'quantity', 1)), v_addr, gen_random_uuid());
    raise exception 'não deu erro';
  exception when others then
    if sqlerrm <> 'cadastro_incompleto' then raise exception 'FALHOU: cadastro, veio "%"', sqlerrm; end if;
  end;

  -- 8. Visitante sem login não chama as funções.
  reset role;
  set local role anon;
  begin
    perform public.create_order('[]'::jsonb, v_addr, gen_random_uuid());
    raise exception 'não deu erro';
  exception when others then
    if position('permission denied' in sqlerrm) = 0 then raise exception 'FALHOU: anônimo, veio "%"', sqlerrm; end if;
  end;

  raise exception 'OK: todos os testes passaram (nada foi alterado)';
end $$;

rollback;
