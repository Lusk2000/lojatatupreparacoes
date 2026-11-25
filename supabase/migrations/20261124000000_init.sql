-- Tatu Preparações: esquema inicial da loja (fase 1).
-- Rode uma vez, inteiro, em Supabase > SQL Editor.

begin;

-- ---------- Tabelas ----------
create table public.categories (
  name text primary key,
  sort integer not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null references public.categories (name) on update cascade,
  description text not null default '',
  price_cents integer check (price_cents > 0),   -- nulo = "preço em breve"
  sku text unique,
  stock integer check (stock >= 0),
  weight_g integer check (weight_g > 0),
  height_cm numeric(7,1) check (height_cm > 0),
  width_cm numeric(7,1) check (width_cm > 0),
  length_cm numeric(7,1) check (length_cm > 0),
  ncm text,
  image_url text not null default '',
  video_url text,
  active boolean not null default true,
  on_quote boolean not null default false,       -- "sob consulta"
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  cpf_cnpj text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  zip_code text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state char(2) not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'awaiting_payment' check (status in
    ('awaiting_payment','paid','invoiced','shipped','delivered','cancelled','refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,                    -- nome no momento da compra
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity integer not null check (quantity > 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  provider text not null check (provider in ('asaas','mercadopago')),
  method text not null check (method in ('pix','boleto','card')),
  provider_ref text,
  status text not null default 'pending',
  installments integer not null default 1 check (installments between 1 and 12),
  amount_cents integer not null check (amount_cents > 0),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_ref)
);

-- Uma única linha de configurações da loja.
create table public.store_settings (
  id boolean primary key default true check (id),
  active_gateway text not null default 'asaas' check (active_gateway in ('asaas','mercadopago'))
);

-- Administradores: só se cadastra por SQL, direto no banco.
create table public.staff_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','operator')),
  created_at timestamptz not null default now()
);

create index on public.products (category);
create index on public.addresses (customer_id);
create index on public.orders (customer_id, created_at desc);
create index on public.order_items (order_id);
create index on public.order_items (product_id);
create index on public.payments (order_id);

-- ---------- Funções e gatilhos ----------
create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_roles where user_id = (select auth.uid()));
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

-- Cria o cadastro do cliente junto com a conta.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.customers (id, email, full_name, cpf_cnpj, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'cpf_cnpj', ''), 18),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 20)
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.customers (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do nothing;

revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- Permissões ----------
revoke all on public.categories, public.products, public.customers, public.addresses,
  public.orders, public.order_items, public.payments, public.store_settings,
  public.staff_roles from anon, authenticated;

grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.customers, public.orders, public.order_items, public.payments,
  public.staff_roles, public.store_settings to authenticated;
grant update (full_name, cpf_cnpj, phone) on public.customers to authenticated;
grant update (active_gateway) on public.store_settings to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.store_settings enable row level security;
alter table public.staff_roles enable row level security;

create policy "categorias visiveis" on public.categories for select to anon, authenticated using (true);
create policy "equipe gerencia categorias" on public.categories for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "produtos ativos visiveis" on public.products for select to anon, authenticated using (active);
create policy "equipe gerencia produtos" on public.products for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "cliente le o proprio cadastro" on public.customers for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
create policy "cliente atualiza o proprio cadastro" on public.customers for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "cliente gerencia os proprios enderecos" on public.addresses for all to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
create policy "equipe le enderecos" on public.addresses for select to authenticated using (public.is_staff());

-- Pedidos, itens e pagamentos: o navegador só lê. Quem grava é o servidor (fase 3).
create policy "le os proprios pedidos" on public.orders for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff());
create policy "le itens dos proprios pedidos" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = (select auth.uid()) or public.is_staff())));
create policy "le pagamentos dos proprios pedidos" on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = (select auth.uid()) or public.is_staff())));

create policy "equipe le configuracoes" on public.store_settings for select to authenticated
  using (public.is_staff());
create policy "equipe altera configuracoes" on public.store_settings for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "le o proprio papel" on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()));

insert into public.store_settings default values;

-- Catálogo atual. Preço, estoque, peso e NCM ficam vazios para o admin preencher.
insert into public.categories (name, sort) values
  ('Kits F250', 1),
  ('Kits Silverado', 2),
  ('Kits RAM', 3),
  ('Motores', 4),
  ('Bonés', 5),
  ('Copos', 6),
  ('Camisetas', 7),
  ('Kits Churrasco', 8),
  ('Filtros', 9),
  ('Pneus', 10),
  ('Baterias', 11),
  ('Suspensão', 12),
  ('Iluminação', 13);

insert into public.products (slug, name, category, description, image_url, video_url, sort) values
  ('silverado-kit-inox-001', 'Kit Full Inox Motor Silverado', 'Kits Silverado', 'Reservatório de água
Entrada do radiador (com mangotes de silicone e 4 abraçadeiras)
Pressurização (para turbina grande ou pequena + um mangote de silicone 2 abraçadeiras)
Intake com filtro de ar (mangote silicone e 1 abraçadeira', 'https://i.ibb.co/23jX2FnW/Kit-Full-Inox-SILVERADO1.gif', null, 1),
  ('cummins-6bt-kit-002', 'Kit Performance - Cummins 6BT', 'Motores', 'Coletor dimensionado com parafuso de fixação 
6 ponteiras de bico de alta performance 
Válvulas de alivio 
Turbina retrabalhada .70 Holset
Junta de aço inox', 'https://i.ibb.co/S4CGfd5L/Cummins-6bt.gif', null, 2),
  ('escape-full-inox-f250', 'Escape Silverado MWM Full Inox c/ Downpipe', 'Kits Silverado', 'Escapamento de 4″ com flexível e ponteira de 5″', 'https://i.ibb.co/99xVbKj3/Kit-Full-Inox-SILVERADO.gif', null, 3),
  ('embreagem-ceramica-f250', 'Kit Embreagem Preparada para F-250 Estágio 1', 'Kits F250', 'Plator retrabalhado 
Rolamento de embreagem 
Disco de embreagem pastilhado', 'https://i.ibb.co/qYRc9Mqg/Kit-de-Embreagem-de-Cer-mica.jpg', null, 4),
  ('kit-performance-f250-mwm', 'Kit 200 cv’s Acima do Original para F-250 / Silverado MWM', 'Kits F250', 'Coletor dimensionado T3
12 parafusos de fixação 
6 ponteiras de bico de alta performance
Junta do cabeçote de aço 
Junta do coletor de aço inox
Bomba injetora preparada e revisada (A BASE DE TROCA) 200cv
Turbina retrabalhada .70 Borgwarner
Válvula de alívio
Kit bomba elétrica c/ dosador ou bomba mecânica
Junta da admissão original
Filtro lubrificante original
Kit junta da tampa de válvula
Kit retorno e flexível de turbina
Curva de turbinada com saída para válvula
1 bardal e 1 militec 
Jogo de prisioneiros de turbina
Jogo de junta de turbina', 'https://i.ibb.co/chQ1LYvk/Kit-Performance-Completo-F-250-MWM-Sprint.jpg', null, 5),
  ('kit-performance-tatu-mwm-inox-bicos', 'Kit 50 cv’s para Silverado', 'Motores', 'Coletor dimensionado 
12 parafusos de fixação 
6 ponteiras de bico de alta vazão 
Pressurização full inox
1 mangote de silicone com 2 abraçadeiras', 'https://i.ibb.co/nq99xc76/Kit-de-Coletor-Dimensionado-e-Sa-da-de-Escapamento-MWM-Sprint-6-07.jpg', null, 6),
  ('kit-premium-f250-intake-reservatorio', 'Kit Full Inox Cofre F-250', 'Kits F250', 'Kit intake com filtro de ar (1 mangote de silicone 2 abraçadeiras)
Reservatório de água 
Reservatório de direção hidráulica 
Protetor da caixa do ar condicionado
Calha do chicote de fio
Saída do Intercooler (2 mangotes de silicone + 4 abraçadeiras)
Tampão do sistema do ABS
Entrada do Intercooler
Kit escapamento full inox c/ Downpipe', 'https://i.ibb.co/1fx8NzsC/kit-premium.gif', null, 7),
  ('kit-performance-f250-mwm-bomba-p7100', 'Kit 100 cv’s Acima do Original para F-250 / Silverado MWM', 'Kits F250', 'Coletor dimensionado
12 parafusos de fixação
6 ponteiras de bico alta vazão 
Bomba injetora preparada e revisada (A BASE DE TROCA)', 'https://i.ibb.co/ZzTrLL2s/Kit-Performance-F-250-MWM-Bomba-P7100.jpg', null, 8),
  ('kit-full-inox-silverado-premium-gif', 'Escape Full Inox F-250 MWM c/ Downpipe', 'Kits F250', 'Escapamento de 4″ com flexível e ponteira de 5″', 'https://i.ibb.co/ZpTbVjP4/Kit-Full-Inox-Silverado.gif', null, 9),
  ('pino-lda-buster', 'Kit LDA buster', 'Motores', 'Pino em aço forjado padrão gringo desenvolvido para performance com extrema qualidade e durabilidade junto a mola de pressão calibrada para maior desempenho

01 PINO DE AÇO FORJADO
01 MOLA DE PRESSÃO', 'https://i.ibb.co/fGkBK3Wh/Pino-LDA.gif', null, 10),
  ('kit-rodas-aro18-f250', 'Kit com 4 Rodas, Aro 18 F-250', 'Kits F250', 'Jogo completo com 4 rodas aro 18 para F-250. Visual exclusivo e acabamento premium.', 'https://i.ibb.co/20N184vs/Kit-com-4-Rodas.gif', null, 11),
  ('kit-rodas-aro20-f250', 'Kit com 4 Rodas, Aro 20 F-250', 'Kits F250', 'Jogo completo com 4 rodas aro 20 para F-250. Visual exclusivo e acabamento premium.', 'https://i.ibb.co/snBHBKW/Kit-aro-20.gif', null, 12),
  ('kit-emblema-f250', 'Kit Emblema F-250', 'Kits F250', 'Renove a identidade da sua bruta. Kit completo de emblemas com acabamento impecável.', 'https://i.ibb.co/Zz0P97r9/Kit-emblema-F250.gif', null, 13),
  ('kit-40cv-s10', 'Kit 40 cv’s para S10', 'Motores', 'Coletor dimensionado 
8 parafusos de fixação 
4 ponteiras de bico de alta vazão', 'https://i.ibb.co/N2xB0XqL/Kit-40-cavalos.png', null, 14),
  ('turbina-borgwarner-70', 'Turbina Retrabalhada .70 Borgwarner', 'Motores', 'Turbina retrabalhada para motores MWM', 'https://i.ibb.co/mrkh4mk6/Turbina.png', null, 15),
  ('lanterna-traseira-americana', 'Lanterna Traseira Americana', 'Iluminação', 'Estilo americano clássico e iluminação de alta visibilidade para sua caminhonete.', 'https://i.ibb.co/ZzrvCGYz/Lanterna-Traseira-Americana.gif', null, 16),
  ('forro-corta-fogo-f250', 'Forro Corta Fogo', 'Kits F250', 'Proteção térmica e isolamento acústico para o cofre do motor. Item essencial para conservação e performance.', 'https://i.ibb.co/TDpDBhc5/Forro-corta-fogo-f250.png', null, 17),
  ('defletor-superior-radiador-f250', 'Defletor Superior Radiador F-250', 'Kits F250', 'Acabamento e proteção para a parte superior do radiador. Melhora a estética do cofre e auxilia no direcionamento de ar.', 'https://i.ibb.co/7Nywmxd5/Defletor-Superior-Radiador-F250.png', null, 18),
  ('kit-troca-oleo-mwm', 'Kit troca de óleo - MWM Sprint Silverado e F-250', 'Filtros', 'Kit completo para troca de óleo e filtros. Essencial para a manutenção preventiva do motor MWM Sprint.', 'https://i.ibb.co/qMf4xspw/kit-troca-de-oleo.jpg', null, 19),
  ('filtro-diesel-f250-original', 'Filtro diesel original F-250', 'Filtros', 'Filtro de combustível original para F-250. Garanta a pureza do diesel e a proteção do seu sistema de injeção.', 'https://i.ibb.co/wh4Fh0mC/Filtro-diesel-original.jpg', null, 20),
  ('filtro-diesel-silverado-original', 'Filtro diesel original Silverado', 'Filtros', 'Filtro de combustível original para Silverado. Essencial para manter o desempenho e durabilidade do motor.', 'https://i.ibb.co/b5zQ2Gjy/Filtro-diesel-original-Silverado.jpg', null, 21),
  ('oleo-aditivo-diesel', 'Óleo aditivo para motores diesel', 'Filtros', 'Aditivo de alta performance para motores diesel. Melhora a combustão, limpa o sistema e protege contra corrosão.', 'https://i.ibb.co/hJSKzmHC/leo-aditivo-para-motores-diesel.jpg', null, 22),
  ('oleo-motor-diesel', 'Óleo para motores diesel', 'Filtros', 'Lubrificante de alta qualidade para motores diesel. Proteção superior contra desgaste e borra.', 'https://i.ibb.co/SXt3SQLZ/leo-para-motores-diesel.jpg', null, 23),
  ('parafuso-cabecote-mwm', 'Parafuso do cabeçote MWM Sprint', 'Motores', 'Jogo de parafusos para cabeçote do motor MWM Sprint. Alta resistência para aguentar a pressão.', 'https://i.ibb.co/ZRRCpKB7/Parafuso-do-cabe-ote-MWM-Sprint.jpg', null, 24),
  ('junta-admissao-mwm-6cc', 'Junta da admissão MWM Sprint 6 cilindro', 'Motores', 'Junta de vedação para coletor de admissão do motor MWM Sprint 6 cilindros. Material resistente e encaixe perfeito.', 'https://i.ibb.co/HWb3Zrr/Junta-da-admiss-o-MWM-Sprint-6-cilindro.jpg', null, 25),
  ('junta-cabecote-f250-mwm-aco', 'Junta do cabeçote F-250 MWM', 'Motores', 'Junta de cabeçote de alta resistência para motores MWM F-250. Essencial para preparações e manutenção.', 'https://i.ibb.co/TMWHVqQJ/Junta-do-cabe-ote-F-250-MWM.jpg', null, 26),
  ('kit-intake-performance', 'Kit Intake', 'Motores', 'Sistema de admissão de ar de alta performance. Aumenta o fluxo de ar para o motor e proporciona um visual esportivo.', 'https://i.ibb.co/YBXdjntr/Kit-intake.jpg', null, 27),
  ('tampa-oleo-esportiva', 'Tampa do óleo', 'Motores', 'Tampa de óleo em alumínio com acabamento anodizado. Estilo e qualidade para o cofre do motor.', 'https://i.ibb.co/LXbDDz78/Tampa-de-oleo.jpg', null, 28),
  ('bone-tatu-gif-01', 'Boné Tatu Trucker - Modelo 01', 'Bonés', 'Estilo e atitude Tatu Preparações. Peça o seu boné!', 'https://i.ibb.co/V09M4WPh/gif1.gif', null, 29),
  ('bone-tatu-gif-02', 'Boné Tatu Trucker - Modelo 02', 'Bonés', 'Qualidade premium e design exclusivo. Garanta o seu!', 'https://i.ibb.co/mrjNVNpf/gif2.gif', null, 30),
  ('bone-tatu-gif-03', 'Boné Tatu Trucker - Modelo 03', 'Bonés', 'Para quem veste a camisa da marca. Adquira já!', 'https://i.ibb.co/8D9Dcs8b/gif4.gif', null, 31),
  ('bone-tatu-gif-04', 'Boné Tatu Trucker - Modelo 04', 'Bonés', 'Complete seu visual com estilo. Compre agora!', 'https://i.ibb.co/ym4sCxwW/gif5.gif', null, 32),
  ('copo-tatu-01', 'Copo Térmico Tatu - Edição Especial', 'Copos', 'Bebida gelada até o último gole. Garanta o seu copo!', 'https://i.ibb.co/Fkbrm98d/gif3.gif', null, 33),
  ('camiseta-tatu-01', 'Camiseta Tatu - Modelo 01', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/wN9pQncw/1.jpg', null, 34),
  ('camiseta-tatu-02', 'Camiseta Tatu - Modelo 02', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/JMv01Qp/6.jpg', null, 35),
  ('camiseta-tatu-03', 'Camiseta Tatu - Modelo 03', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/Tqw6f90Q/modelo-03.jpg', null, 36),
  ('camiseta-tatu-04', 'Camiseta Tatu - Modelo 04', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/YBNF0Ys7/modelo-04.jpg', null, 37),
  ('camiseta-tatu-05', 'Camiseta Tatu - Modelo 05', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/93W6dvkk/modelo-05.jpg', null, 38),
  ('camiseta-tatu-06', 'Camiseta Tatu - Modelo 06', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/xSyt24BC/modelo-06.jpg', null, 39),
  ('camiseta-tatu-07', 'Camiseta Tatu - Modelo 07', 'Camisetas', 'Conforto e durabilidade. Vista Tatu Preparações!', 'https://i.ibb.co/fzDrn4XB/modelo-07.jpg', null, 40),
  ('kit-churrasco-01', 'Kit Churrasco Tatu Premium', 'Kits Churrasco', 'Para o churrasqueiro de respeito. Adquira seu kit!', 'https://i.ibb.co/BKn7nGk8/1.jpg', null, 41),
  ('capa-bateria-tatu-01', 'Capa de Bateria Tatu Preparações', 'Baterias', 'O detalhe que faltava no seu cofre. Compre agora!', 'https://i.ibb.co/XxzZ5WM4/capa-de-bateria.jpg', null, 42);

commit;
