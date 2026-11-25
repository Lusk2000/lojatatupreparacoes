import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { AuthProvider } from './lib/auth';
import { CartProvider } from './lib/cartContext';
import { PRODUCT_QUERY_PARAM } from './lib/productShare';

const ProductPage = lazy(() => import('./pages/ProductPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
// Carregado à parte: o cliente da loja não baixa o código do admin.
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

// Os links de prévia dos produtos chegam como /?produto=<slug>.
const Home: React.FC = () => {
  const [params] = useSearchParams();
  const slug = params.get(PRODUCT_QUERY_PARAM);
  return slug ? <Navigate to={`/produto/${encodeURIComponent(slug)}`} replace /> : <HomePage />;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produto/:slug" element={<ProductPage />} />
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/cadastro" element={<SignupPage />} />
            <Route path="/minha-conta" element={<AccountPage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
