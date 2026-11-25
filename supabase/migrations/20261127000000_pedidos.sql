-- Criação e cancelamento de pedidos no banco (checkout).
-- Rode uma vez, inteiro, em Supabase > SQL Editor.
--
-- O navegador envia só produto e quantidade. Preço, estoque e total são lidos e
-- conferidos aqui. O frete ainda não entra no total.

begin;

-- Identificador gerado pela tela: repetir o envio não duplica o pedido.
alter table public.orders add column if not exists client_ref uuid;
create unique index if not exists orders_client_ref_key on public.orders (customer_id, client_ref);

-- p_items:   [{"slug": "...", "quantity": 1}, ...]
-- p_address: {"zip_code","street","number","complement","district","city","state"}
create or replace function public.create_order(p_items jsonb, p_address jsonb, p_client_ref uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_customer public.customers%rowtype;
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_address jsonb;
  v_item record;
  v_lines jsonb := '[]'::jsonb;
  v_total bigint := 0;
begin
  if v_user is null then raise exception 'nao_autenticado'; end if;
  if p_client_ref is null then raise exception 'pedido_invalido'; end if;

  -- Trava o cliente: pedidos simultâneos da mesma conta entram em fila.
  select * into v_customer from public.customers where id = v_user for update;
  if not found then raise exception 'cadastro_incompleto'; end if;

  select * into v_order from public.orders where customer_id = v_user and client_ref = p_client_ref;
  if found then
    return jsonb_build_object('id', v_order.id, 'number', v_order.number, 'total_cents', v_order.total_cents);
  end if;

  if trim(v_customer.full_name) = '' or trim(v_customer.cpf_cnpj) = '' or trim(v_customer.phone) = '' then
    raise exception 'cadastro_incompleto';
  end if;

  -- Cada pedido segura estoque; limita quanto uma conta consegue segurar.
  if (select count(*) from public.orders where customer_id = v_user and status = 'awaiting_payment') >= 3 then
    raise exception 'muitos_pedidos_abertos';
  end if;

  v_address := jsonb_build_object(
    'zip_code', regexp_replace(coalesce(p_address ->> 'zip_code', ''), '\D', '', 'g'),
    'street', left(trim(coalesce(p_address ->> 'street', '')), 120),
    'number', left(trim(coalesce(p_address ->> 'number', '')), 20),
    'complement', left(trim(coalesce(p_address ->> 'complement', '')), 60),
    'district', left(trim(coalesce(p_address ->> 'district', '')), 80),
    'city', left(trim(coalesce(p_address ->> 'city', '')), 80),
    'state', upper(trim(coalesce(p_address ->> 'state', '')))
  );
  if (v_address ->> 'zip_code') !~ '^\d{8}$'
    or (v_address ->> 'state') !~ '^[A-Z]{2}$'
    or (v_address ->> 'street') = '' or (v_address ->> 'number') = ''
    or (v_address ->> 'district') = '' or (v_address ->> 'city') = '' then
    raise exception 'endereco_invalido';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'pedido_invalido';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where coalesce(e ->> 'slug', '') = '' or coalesce(e ->> 'quantity', '') !~ '^[1-9]\d{0,2}$'
  ) then
    raise exception 'pedido_invalido';
  end if;

  -- Trava os produtos sempre na mesma ordem para dois pedidos não venderem a
  -- mesma unidade.
  perform 1 from public.products
    where slug in (select e ->> 'slug' from jsonb_array_elements(p_items) e)
    order by id for update;

  -- Produto repetido na lista é somado antes de conferir o estoque.
  for v_item in
    select e ->> 'slug' as slug, sum((e ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) e
    group by 1 order by 1
  loop
    select * into v_product from public.products where slug = v_item.slug;
    if not found or not v_product.active or v_product.on_quote
      or v_product.price_cents is null or v_product.stock is null then
      raise exception 'produto_indisponivel' using detail = v_item.slug;
    end if;
    if v_item.quantity > v_product.stock then
      raise exception 'sem_estoque' using detail = v_item.slug;
    end if;
    v_total := v_total + v_product.price_cents::bigint * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'id', v_product.id, 'name', v_product.name,
      'price', v_product.price_cents, 'quantity', v_item.quantity);
  end loop;

  if v_total > 2000000000 then raise exception 'pedido_invalido'; end if;

  insert into public.orders (customer_id, subtotal_cents, total_cents, shipping_address, client_ref)
  values (v_user, v_total, v_total, v_address, p_client_ref)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, unit_price_cents, quantity)
  select v_order.id, (l ->> 'id')::uuid, l ->> 'name', (l ->> 'price')::integer, (l ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) l;

  -- Reserva o estoque.
  update public.products p set stock = p.stock - (l ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) l
  where p.id = (l ->> 'id')::uuid;

  return jsonb_build_object('id', v_order.id, 'number', v_order.number, 'total_cents', v_order.total_cents);
end $$;

-- Só cancela o que ainda aguarda pagamento, e devolve o estoque uma única vez.
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'cancelled'
  where id = p_order_id and status = 'awaiting_payment'
    and (customer_id = auth.uid() or public.is_staff());
  if not found then raise exception 'nao_cancelavel'; end if;

  perform 1 from public.products
    where id in (select product_id from public.order_items where order_id = p_order_id)
    order by id for update;

  update public.products p set stock = coalesce(p.stock, 0) + i.quantity
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = p_order_id group by product_id
  ) i
  where p.id = i.product_id;
end $$;

revoke execute on function public.create_order(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, uuid) to authenticated;
revoke execute on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

commit;
