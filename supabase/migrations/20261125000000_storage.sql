-- Armazenamento de fotos e vídeos dos produtos.
-- Rode uma vez, inteiro, em Supabase > SQL Editor.

begin;

-- Público para leitura pelo endereço do arquivo. Limite de 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4']);

-- Só a equipe envia, troca ou apaga. Não há regra de listagem geral de propósito.
create policy "equipe envia midia" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_staff());
create policy "equipe altera midia" on storage.objects for update to authenticated
  using (bucket_id = 'product-media' and public.is_staff())
  with check (bucket_id = 'product-media' and public.is_staff());
create policy "equipe apaga midia" on storage.objects for delete to authenticated
  using (bucket_id = 'product-media' and public.is_staff());

commit;
