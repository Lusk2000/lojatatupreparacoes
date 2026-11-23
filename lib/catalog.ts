import { Product } from '../types';
import { STATIC_PRODUCTS } from '../constants';
import { supabase } from './supabase';

export const fetchMergedCatalog = async (): Promise<Product[]> => {
  let allProducts: Product[] = [...STATIC_PRODUCTS];

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data) {
      const dbProducts = data as unknown as Product[];
      const existingIds = new Set(allProducts.map((p) => p.id));
      const uniqueDbProducts = dbProducts.filter((p) => !existingIds.has(p.id));
      allProducts = [...allProducts, ...uniqueDbProducts];
    }
  } catch {
    // Preserve static catalog seamlessly when offline or unreachable
  }

  return allProducts;
};
