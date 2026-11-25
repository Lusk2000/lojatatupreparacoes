import { useEffect, useState } from 'react';
import { Catalog, fetchCatalog } from '../lib/catalog';

// Nulo enquanto carrega.
export const useCatalog = (): Catalog | null => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    let isCancelled = false;
    fetchCatalog().then((result) => {
      if (!isCancelled) setCatalog(result);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  return catalog;
};
