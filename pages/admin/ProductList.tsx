import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '../../components/ProductImage';
import { formatCents } from '../../lib/money';
import { supabase } from '../../lib/supabase';
import { normalizeText } from '../../lib/utils';

interface Row {
  id: string;
  name: string;
  category: string;
  image_url: string;
  price_cents: number | null;
  stock: number | null;
  weight_g: number | null;
  active: boolean;
  on_quote: boolean;
}

const controlClass =
  'min-h-[44px] px-3 bg-[#181818] border border-white/15 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#E10600]';

// Consulta direta (e não o catálogo da loja) para mostrar também os inativos.
const ProductList: React.FC = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let isCancelled = false;
    supabase
      .from('products')
      .select('id,name,category,image_url,price_cents,stock,weight_g,active,on_quote')
      .order('sort')
      .order('name')
      .then((result) => {
        if (isCancelled) return;
        if (result.error) setError('Não foi possível carregar os produtos.');
        else setRows(result.data as Row[]);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const categories = useMemo(() => [...new Set(rows?.map((r) => r.category))].sort(), [rows]);

  const isPending = (r: Row) => (!r.on_quote && r.price_cents == null) || r.stock == null || r.weight_g == null;

  const visible = rows?.filter(
    (r) =>
      normalizeText(r.name).includes(normalizeText(search.trim())) &&
      (!category || r.category === category) &&
      (!onlyPending || isPending(r))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold uppercase">Produtos</h1>
        <Link to="/admin/produtos/novo"
          className="min-h-[44px] inline-flex items-center bg-[#E10600] hover:bg-red-700 px-5 rounded-xl font-semibold">
          Novo produto
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className={`${controlClass} flex-1 min-w-[200px]`} placeholder="Buscar por nome"
          aria-label="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={controlClass} aria-label="Categoria" value={category}
          onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          Só incompletos ({rows?.filter(isPending).length ?? 0})
        </label>
      </div>

      {error && <p role="alert" className="text-amber-300">{error}</p>}
      {!rows && !error && <p className="text-gray-400">Carregando...</p>}
      {visible?.length === 0 && <p className="text-gray-400">Nenhum produto encontrado.</p>}

      <ul className="space-y-2">
        {visible?.map((r) => (
          <li key={r.id}>
            <Link to={`/admin/produtos/${r.id}`}
              className="flex items-center gap-3 bg-[#181818] border border-white/10 hover:border-white/30 rounded-xl p-3">
              <ProductImage src={r.image_url} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0"
                fallbackClassName="w-14 h-14 shrink-0 flex items-center justify-center text-[10px] text-gray-500"
                iconClassName="w-5 h-5" />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{r.name}</span>
                <span className="block text-xs text-gray-400">
                  {r.category}{!r.active && ' · desativado'}{isPending(r) && ' · incompleto'}
                </span>
              </span>
              <span className="text-right text-sm shrink-0">
                <span className="block font-semibold">
                  {r.on_quote ? 'Sob consulta' : r.price_cents == null ? 'Sem preço' : formatCents(r.price_cents)}
                </span>
                <span className="block text-xs text-gray-400">
                  {r.stock == null ? 'Estoque não informado' : `${r.stock} em estoque`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
