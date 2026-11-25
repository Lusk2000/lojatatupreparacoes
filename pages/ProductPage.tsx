import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ProductImage from '../components/ProductImage';
import AddToCartButton from '../components/AddToCartButton';
import { primaryButtonClass } from '../components/FormField';
import { useCatalog } from '../hooks/useCatalog';
import { productSlug } from '../lib/productShare';

const ProductPage: React.FC = () => {
  const { slug } = useParams();
  const catalog = useCatalog();
  const product = catalog?.products.find((p) => productSlug(p) === slug);

  useEffect(() => {
    if (!product) return;
    const previous = document.title;
    document.title = `${product.name} | Tatu Preparações`;
    return () => {
      document.title = previous;
    };
  }, [product]);

  if (!catalog) return <PageLayout><p className="text-gray-400">Carregando...</p></PageLayout>;

  if (!product) {
    return (
      <PageLayout>
        <h1 className="text-2xl font-bold uppercase">Produto não encontrado</h1>
        <Link to="/" className="underline text-gray-300">Voltar à loja</Link>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <article className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#181818] rounded-2xl p-4 flex items-center justify-center">
          <ProductImage src={product.image}
            animation={product.animation} alt={product.name}
            className="max-w-full max-h-[520px] object-contain rounded-lg" loading="eager" />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{product.category}</p>
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="text-2xl font-bold text-[#E10600]">{product.price ?? 'Preço em breve'}{product.stock === 0 && ' · Esgotado'}</p>
          {product.description && (
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</p>
          )}
          {product.video && (
            <a href={product.video} target="_blank" rel="noopener noreferrer" className="underline text-gray-300">
              Ver vídeo
            </a>
          )}
          <AddToCartButton
            product={product}
            showCartLink
            className={`${primaryButtonClass} flex items-center justify-center gap-2`}
            consultLabel={"Consultar pelo WhatsApp"}
          />
        </div>
      </article>
    </PageLayout>
  );
};

export default ProductPage;
