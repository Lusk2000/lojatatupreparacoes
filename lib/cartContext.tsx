import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addToCart, CartItem, parseStoredCart, setQuantity } from './cart';

const STORAGE_KEY = 'tatu-carrinho';

const readStorage = (): CartItem[] => {
  try {
    return parseStoredCart(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
};

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (slug: string, stock: number) => void;
  update: (slug: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState(readStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sem armazenamento (aba privada etc.): o carrinho vale só nesta visita.
    }
  }, [items]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(parseStoredCart(e.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add: (slug, stock) => setItems((prev) => addToCart(prev, slug, stock)),
      update: (slug, quantity) => setItems((prev) => setQuantity(prev, slug, quantity)),
      clear: () => setItems([]),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart precisa estar dentro de CartProvider');
  return context;
};
