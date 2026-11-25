# Plano: Tatu Preparações como loja online

Data: 24/11/2026. Nada foi implementado ainda.

## 1. O que muda

De vitrine que fecha venda no WhatsApp para loja com carrinho, pagamento, estoque, pedidos, nota fiscal, notificações e painel administrativo. O WhatsApp fica só como canal de suporte.

## 2. Situação atual e bloqueios

| Item | Hoje | Consequência |
|---|---|---|
| Preços | Nenhum produto tem preço | Sem isso não há carrinho |
| Estoque, SKU, peso, medidas, NCM | Não existem | Necessários para frete e nota fiscal |
| Banco (Supabase) | O projeto apontado no código não responde e não está na conta conectada | Criar um projeto novo |
| Páginas | Uma página só, sem rotas | Adicionar roteador |
| Servidor | Não existe | Necessário para pagamento e nota |
| Domínio tatupreparacoes.com | Não respondeu | Verificar registro e DNS |
| Alterações recentes | Sem commit, em pasta temporária da sessão | Fazer commit e mover a pasta antes de começar |

## 3. Arquitetura

- **Loja (frontend):** React + Vite + TypeScript atuais, com React Router.
- **Banco, login e arquivos:** Supabase (Postgres, Auth, Storage para fotos).
- **Servidor:** Supabase Edge Functions (checkout, webhooks, nota, frete, e-mail).
- **Hospedagem:** Cloudflare Pages ou Vercel. O plano gratuito da Vercel é para uso não comercial, então confira os termos antes de usá-lo.

### Regras de segurança

1. Tokens de pagamento, nota fiscal, frete e certificado A1 ficam só no servidor. Nunca em variáveis `VITE_*`.
2. O servidor recalcula o total do pedido com os preços do banco. O valor vindo do navegador é ignorado.
3. Dados de cartão passam só pelo checkout tokenizado ou hospedado do gateway.
4. Webhooks validam a origem e podem chegar repetidos sem duplicar efeito.
5. Todas as tabelas com RLS. Cliente vê só os próprios pedidos.
6. A chave do Supabase sai do código e vai para variável de ambiente.

A hospedagem precisa redirecionar todas as rotas para `index.html`.

## 4. Banco de dados

| Tabela | Conteúdo |
|---|---|
| `categories` | nome, ordem |
| `products` | nome, descrição, preço, SKU, estoque, peso, medidas, NCM, ativo, "sob consulta" |
| `product_media` | fotos e vídeos |
| `customers` | nome, CPF/CNPJ, e-mail, telefone |
| `addresses` | endereços do cliente |
| `orders` | cliente, status, subtotal, frete, desconto, total |
| `order_items` | produto, quantidade, preço no momento da compra |
| `payments` | método, id no gateway, status, vencimento |
| `invoices` | tipo (NF-e/NFS-e), status, chave, XML, PDF |
| `shipments` | transportadora, rastreio, etiqueta |
| `stock_movements` | entradas, reservas, baixas |
| `notifications` | o que foi enviado, para quem, resultado |
| `staff_roles` | quem é admin ou operador |
| `audit_log` | quem alterou o quê no admin |

## 5. Páginas

**Cliente:** início, catálogo, produto (`/produto/:slug`), carrinho, checkout, pagamento (QR Pix / boleto), pedido e rastreio, minha conta, políticas.

**Admin (`/admin`, área separada):** login, painel (vendas e pendências), produtos, estoque, pedidos, clientes, notas fiscais, frete, cupons (opcional), usuários e configurações.

O admin é protegido por login e por papel verificado no banco. Esconder o endereço não conta como proteção. O código do admin é carregado à parte, para o cliente não baixá-lo.

## 6. Fluxo do pedido

```
carrinho → dados e endereço → frete → pedido criado (estoque reservado)
→ AGUARDANDO PAGAMENTO → PAGO (webhook) → NOTA EMITIDA → ENVIADO → ENTREGUE
```

- **Pix:** expira em minutos ou horas. Expirou, cancela e libera o estoque.
- **Boleto:** compensa em até uns 3 dias. A reserva dura até o vencimento mais a compensação.
- **Cartão:** aprovado, recusado ou em análise.
- **Cancelamento e estorno:** se a nota já foi emitida, é preciso cancelar (há prazo) ou emitir nota de devolução. O contador define.
- **Produto sem preço** (ainda não cadastrado pelo admin): aparece como "preço em breve", sem botão de carrinho.
- **Itens "sob consulta"** (projetos e preparações sob medida): botão de orçamento em vez de carrinho.

## 7. Integrações

Valores aproximados, de fontes de terceiros em sua maioria. Confirme nas páginas oficiais antes de contratar.

### Pagamento

| | Mercado Pago | Asaas |
|---|---|---|
| Pix | cerca de 0,99% | cerca de R$ 1,99 fixo |
| Boleto | cerca de R$ 3,49 | R$ 1,99 a R$ 3,49 (fontes divergem) |
| Cartão à vista | cerca de 3,98% a 4,98% | cerca de 2,99% + R$ 0,49 |
| NFS-e | não avaliado | integrada |

Em ticket alto a taxa fixa pesa menos: num kit de R$ 3.000, 0,99% no Pix são cerca de R$ 30. **Sugestão inicial: Asaas**, a confirmar com o ticket médio e o parcelamento que seus clientes usam.

Fontes: [Mercado Pago](https://www.mercadopago.com.br/blog/opcoes-checkout-plataformas-ecommerce), [calculadora de taxas](https://marreiradigital.com.br/calculadora-mercadopago/), [Asaas](https://blog.asaas.com/taxas-asaas/), [comparativo](https://heropay.ai/compare/pagarme-vs-asaas), [notas no Asaas](https://docs.asaas.com/docs/notas-fiscais).

### Nota fiscal

- **Peças e produtos = NF-e** (SEFAZ-MG). Precisa de um emissor próprio: Focus NFe, PlugNotas, Nuvem Fiscal, ou um ERP como Bling ou Tiny. O gateway não faz isso.
- **Serviços:** não serão vendidos pelo site, então não há NFS-e.
- **Pré-requisitos:** CNPJ, Inscrição Estadual, certificado digital A1, regime tributário, NCM e CFOP por produto.
- **Custo:** Focus NFe em torno de R$ 90 a R$ 95/mês para 100 notas ([comparativo](https://emitfy.com/comparativos/emitfy-vs-focus-nfe), [referência](https://github.com/invoicerr-app/invoicerr/issues/908)).
- **Reforma tributária:** o emissor escolhido precisa suportar os campos IBS/CBS ([guia](https://nacao.digital/blog/emissor-de-nota-fiscal/)). Confirme com o contador o que vale para o seu regime em 2027.

### Frete

- Cálculo e etiqueta pelo Melhor Envio (verificar a API na documentação oficial).
- Envio de quem é contribuinte de ICMS vai com NF-e; a declaração de conteúdo é para os outros casos ([ajuda do Melhor Envio](https://centraldeajuda.melhorenvio.com.br/hc/pt-br/articles/41306548209300-Declara%C3%A7%C3%A3o-de-Conte%C3%BAdo-Eletr%C3%B4nica-DC-e-o-que-voc%C3%AA-precisa-saber)).
- Rodas, escapamentos, baterias e óleos podem ter limite de tamanho ou restrição de transporte. Prever transportadora, retirada na loja ou "frete a combinar".

### Notificações

| Evento | Cliente | Loja |
|---|---|---|
| Pedido criado (com Pix/boleto) | e-mail | e-mail |
| Pagamento aprovado | e-mail | e-mail |
| Nota emitida (PDF/XML) | e-mail | painel |
| Enviado (rastreio) | e-mail | painel |
| Cancelado ou boleto vencido | e-mail | painel |
| Estoque baixo | — | painel |

E-mail por um serviço como o Resend. WhatsApp automático (API oficial, paga) fica para depois.

### Requisito: gateway pronto para uso

Asaas e Mercado Pago saem programados por completo (Pix, boleto, cartão, webhooks e estorno). No admin, basta escolher qual usar. A única configuração fora da tela é cadastrar uma vez as chaves de cada conta nos Secrets do Supabase. O admin mostra se cada um está "pronto" ou "falta a chave" e não deixa ativar um sem chave.

## 8. Exigências legais

- CNPJ, razão social, endereço e contato visíveis (Decreto 7.962/2013).
- Direito de arrependimento de 7 dias (Código de Defesa do Consumidor).
- Política de privacidade (LGPD), termos, trocas, devoluções e garantia.
- Peças de desempenho e escapamento: confirmar o que precisa de aviso de uso ou compatibilidade.

## 9. Fases

Andamento: o código da fase 1 está escrito (rotas, cadastro, login, minha conta, catálogo pelo banco). O SQL inicial já foi rodado e o catálogo vem do banco. Fase 2 (admin de produtos em `/admin`): login e salvar preço/estoque testados e o SQL de storage rodado; falta testar envio de foto e a recusa de conta comum. Fase 3, parte 1: carrinho em `/carrinho` pronto (guardado no navegador; só entra produto com preço e estoque). Parte 2: checkout em `/checkout` com endereço; o pedido é criado pela função `create_order` do próprio banco (no lugar da Edge Function `criar-pedido`, que exigiria publicar no projeto), com estoque reservado, cancelamento e limite de 3 pedidos abertos por conta. O SQL de pedidos foi rodado e o teste passou no Supabase. Falta: gateways e webhooks (Edge Functions), ajustar a expiração ao vencimento do Pix/boleto e tratar pagamento que chegue depois do cancelamento. A expiração em 3 dias está em `supabase/migrations/20261128000000_expiracao.sql` (rodada no Supabase em 25/11/2026: agendamento ativo e teste aprovado). Fase 4, parte 1: pedidos no admin (`/admin/pedidos`) com mudança manual de situação (`supabase/migrations/20261129000000_status_pedidos.sql`, teste aprovado no Supabase); faltam os e-mails.

| Fase | Entrega | Pronto quando |
|---|---|---|
| 0. Preparação | Commit do estado atual, pasta definitiva, respostas da seção 10 | Dados dos produtos em mãos |
| 1. Base | Supabase novo (conferir antes o custo e o limite do plano gratuito), tabelas e RLS, catálogo no banco, rotas | Site lê produtos do banco |
| 2. Admin de produtos | Login, cadastro de produtos, fotos, estoque | Você cadastra sem mexer em código |
| 3. Carrinho e pagamento | Checkout, Pix, boleto, cartão, webhooks (sandbox) | Pedido de teste vira "pago" sozinho |
| 4. Pedidos e notificações | Gestão no admin, e-mails, SMTP próprio (o e-mail padrão do Supabase é limitado e só para testes) | Ciclo completo acompanhado |
| 5. Frete | Cotação no checkout, etiqueta, rastreio | Frete correto por CEP |
| 6. Legal e lançamento | Políticas, domínio, testes, produção | **Primeira venda real** |
| 7. Nota automática | NF-e após pagamento (homologação, depois produção) | Nota sai sem ação manual |

Dá para lançar na fase 6 com a nota emitida manualmente (por você ou pelo contador) e automatizar depois.

Os botões "Comprar pelo WhatsApp" viram "Adicionar ao carrinho". As páginas de prévia `/p/` e as miniaturas passam a servir as páginas reais dos produtos.

## Mídia dos produtos (aprovado em 24/11/2026)

Capa parada em WebP nos cards e animação separada só ao abrir o produto, em `public/media/`. O admin comprime fotos novas e recusa animação acima de 2 MB. Opções descartadas: GIF para MP4 (mais mudanças e exige ffmpeg) e serviço externo de conversão (dependência de terceiro). SQL: `supabase/migrations/20261126000000_media_leve.sql`.

## 10. Decisões tomadas (24/11/2026)

| Tema | Decisão |
|---|---|
| Empresa | CNPJ 51.739.819/0001-06 |
| O que se vende | Somente produtos (só NF-e, sem NFS-e) |
| Gateway | Asaas como padrão, com escolha manual do gateway no admin (Asaas ou Mercado Pago) |
| Clientes | Cadastro obrigatório, com histórico de quem comprou, o quê, quando e quais itens |
| Produtos | Preço, estoque, peso e medidas cadastrados manualmente pelo admin |
| Parcelamento | Conforme o que o gateway permitir; juros sempre por conta do cliente |
| Custo mensal | O mínimo possível |
| Usuários do admin | Definidos direto na base de dados |

Pendente (só trava as fases 5 e 7): regime (MEI ou Simples), Inscrição Estadual, certificado A1 e contador.

## 11. Riscos

- Dados fiscais incorretos geram multa: NCM, CFOP e impostos são definidos pelo contador.
- Planos gratuitos podem pausar o banco por inatividade; em produção, prever plano pago.
- Venda sem estoque real: manter o estoque do admin como fonte única, inclusive para vendas no balcão.
