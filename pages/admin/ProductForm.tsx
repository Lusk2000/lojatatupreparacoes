import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormField, { primaryButtonClass } from '../../components/FormField';
import ProductImage from '../../components/ProductImage';
import { clearCatalogCache } from '../../lib/catalog';
import { productSlug } from '../../lib/productShare';
import { supabase } from '../../lib/supabase';
import { EMPTY_FORM, ProductFormValues, ProductRecord, toFormValues, toRecord } from './productData';
import { uploadImage, uploadVideo } from './uploadMedia';

const controlClass =
  'w-full px-3.5 py-2.5 bg-[#181818] border border-white/15 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#E10600]';
const labelClass = 'block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1.5';

type TextField = Exclude<keyof ProductFormValues, 'active' | 'onQuote'>;

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY_FORM);
  const [slug, setSlug] = useState('');
  // Versão carregada: se um pedido baixar o estoque no meio da edição, não sobrescreve.
  const [version, setVersion] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let isCancelled = false;
    setIsReady(false);
    (async () => {
      const [list, product] = await Promise.all([
        client.from('categories').select('name').order('sort').order('name'),
        id ? client.from('products').select('*').eq('id', id).maybeSingle() : null,
      ]);
      if (isCancelled) return;
      if (list.error || product?.error || (id && !product?.data)) {
        setMessage('Não foi possível carregar o produto.');
        return;
      }
      setCategories(list.data.map((c) => c.name as string));
      if (product?.data) {
        const record = product.data as ProductRecord;
        setValues(toFormValues(record));
        setSlug(record.slug);
        setVersion(product.data.updated_at as string);
      }
      setIsReady(true);
    })();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const bind = (field: TextField) => ({
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(field, e.target.value),
  });

  // O endereço do produto é fixo depois de criado: os links /produto/ dependem dele.
  const currentSlug = id ? slug : productSlug({ id: '', name: values.name });

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!supabase || !name) return;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, sort: categories.length + 1 })
      .select();
    if (error || !data?.length) {
      setMessage(error?.code === '23505' ? 'Essa categoria já existe.' : 'Não foi possível criar a categoria.');
      return;
    }
    clearCatalogCache();
    setCategories((prev) => [...prev, name]);
    set('category', name);
    setNewCategory('');
    setMessage('');
  };

  const handleUpload = async (field: 'imageUrl' | 'videoUrl', input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = '';
    if (!supabase || !file) return;
    setIsBusy(true);
    setMessage('Enviando arquivo...');
    try {
      const folder = currentSlug || 'novo';
      if (field === 'videoUrl') {
        set(field, await uploadVideo(supabase, folder, file));
      } else {
        // Foto nova substitui também a animação antiga.
        const { imageUrl, animationUrl } = await uploadImage(supabase, folder, file);
        setValues((prev) => ({ ...prev, imageUrl, animationUrl }));
      }
      setMessage('Arquivo enviado. Clique em Salvar para gravar no produto.');
    } catch (err) {
      setMessage((err as Error).message);
    }
    setIsBusy(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    let record: ProductRecord;
    try {
      record = toRecord(values, currentSlug);
      if (!record.slug) throw new Error('O nome precisa ter letras ou números.');
    } catch (err) {
      return setMessage((err as Error).message);
    }

    setIsBusy(true);
    setMessage('');
    // .select() confirma a gravação: sem permissão, o banco não altera nada e não dá erro.
    const query = id
      ? supabase.from('products').update(record).eq('id', id).eq('updated_at', version).select('id,updated_at')
      : supabase.from('products').insert(record).select('id,updated_at');
    const { data, error } = await query;
    setIsBusy(false);

    if (error?.code === 'PGRST204') {
      return setMessage('O banco ainda não tem o campo de animação. Rode o SQL de mídia leve no Supabase.');
    }
    if (error) {
      return setMessage(
        error.code === '23505'
          ? 'Já existe um produto com este nome (endereço) ou SKU.'
          : 'Não foi possível salvar. Confira os campos.'
      );
    }
    if (!data?.length) {
      return setMessage(
        id
          ? 'Nada foi salvo: o produto mudou desde que você abriu (um pedido, por exemplo). Recarregue a página.'
          : 'Nada foi salvo. Sua conta tem permissão de administrador?'
      );
    }
    setVersion(data[0].updated_at as string);

    clearCatalogCache();
    setValues(toFormValues(record));
    if (!id) {
      setSlug(record.slug);
      navigate(`/admin/produtos/${data[0].id}`, { replace: true });
    }
    setMessage('Produto salvo.');
  };

  if (!isReady) return <p className="text-gray-400">{message || 'Carregando...'}</p>;

  const fileButton = (field: 'imageUrl' | 'videoUrl', accept: string, label: string) => (
    <label className="block text-sm text-gray-300">
      {label}
      <input type="file" accept={accept} disabled={isBusy} className="mt-1 block w-full text-sm"
        onChange={(e) => handleUpload(field, e.target)} />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <Link to="/admin" className="text-sm text-gray-400 hover:text-white">← Produtos</Link>
        <h1 className="text-3xl font-bold uppercase mt-1">{id ? 'Editar produto' : 'Novo produto'}</h1>
        {currentSlug && <p className="text-xs text-gray-500">Endereço: /produto/{currentSlug}</p>}
      </div>

      <FormField label="Nome" required {...bind('name')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className={labelClass}>Categoria</label>
          <select id="category" className={controlClass} value={values.category}
            onChange={(e) => set('category', e.target.value)}>
            <option value="">Escolha...</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="new-category" className={labelClass}>Criar categoria</label>
          <div className="flex gap-2">
            <input id="new-category" className={controlClass} value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)} />
            <button type="button" onClick={addCategory}
              className="px-4 rounded-xl border border-white/15 hover:bg-white/10">Criar</button>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Descrição</label>
        <textarea id="description" rows={5} className={controlClass} value={values.description}
          onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Preço (R$)" inputMode="decimal" placeholder="1.234,56" {...bind('price')} />
        <FormField label="Estoque (unidades)" inputMode="numeric" {...bind('stock')} />
        <FormField label="SKU (código interno)" {...bind('sku')} />
        <FormField label="Peso (gramas)" inputMode="numeric" {...bind('weight')} />
        <FormField label="Altura (cm)" inputMode="decimal" {...bind('height')} />
        <FormField label="Largura (cm)" inputMode="decimal" {...bind('width')} />
        <FormField label="Comprimento (cm)" inputMode="decimal" {...bind('length')} />
        <FormField label="NCM (nota fiscal)" inputMode="numeric" {...bind('ncm')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <FormField label="Foto (endereço)" {...bind('imageUrl')} />
          <FormField label="Animação (opcional, aparece ao abrir o produto)" {...bind('animationUrl')} />
          {fileButton('imageUrl', 'image/jpeg,image/png,image/webp,image/gif', 'Ou envie uma foto (é comprimida sozinha; GIF até 2 MB)')}
          {values.imageUrl && (
            <ProductImage key={values.imageUrl} src={values.imageUrl} alt="Prévia da foto"
              className="max-h-48 rounded-lg" />
          )}
        </div>
        <div className="space-y-3">
          <FormField label="Vídeo (endereço)" {...bind('videoUrl')} />
          {fileButton('videoUrl', 'video/mp4', 'Ou envie um vídeo MP4 (até 5 MB)')}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-200">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.active} onChange={(e) => set('active', e.target.checked)} />
          Visível na loja (desmarque para desativar)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.onQuote} onChange={(e) => set('onQuote', e.target.checked)} />
          Sob consulta (sem preço na loja, cliente pede orçamento)
        </label>
      </div>

      {message && <p role="status" className="text-sm text-amber-300">{message}</p>}
      <button type="submit" disabled={isBusy} className={primaryButtonClass}>Salvar</button>
    </form>
  );
};

export default ProductForm;
