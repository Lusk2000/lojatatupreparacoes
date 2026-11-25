import React, { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import OrderList from './OrderList';

type Access = 'checking' | 'allowed' | 'denied' | 'error';

// Esta guarda só organiza a tela. Quem protege os dados são as regras (RLS) do banco.
const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const userId = user?.id;
  const [access, setAccess] = useState<Access>('checking');

  useEffect(() => {
    if (!supabase || !userId) return;
    let isCancelled = false;
    setAccess('checking');
    supabase.rpc('is_staff').then(({ data, error }) => {
      if (!isCancelled) setAccess(error ? 'error' : data ? 'allowed' : 'denied');
    });
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (isLoading) return <PageLayout><p className="text-gray-400">Carregando...</p></PageLayout>;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;

  if (access !== 'allowed') {
    return (
      <PageLayout>
        <p className="text-gray-300">
          {access === 'checking' && 'Verificando acesso...'}
          {access === 'denied' && `A conta ${user.email} não tem acesso à administração.`}
          {access === 'error' && 'Não foi possível verificar o acesso. Recarregue a página.'}
        </p>
      </PageLayout>
    );
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `pb-2 border-b-2 ${isActive ? 'border-[#E10600] text-white' : 'border-transparent text-gray-400 hover:text-white'}`;

  return (
    <PageLayout>
      <nav className="flex gap-6 mb-6 text-sm font-semibold uppercase" aria-label="Administração">
        <NavLink to="/admin" end className={tabClass}>Produtos</NavLink>
        <NavLink to="/admin/pedidos" className={tabClass}>Pedidos</NavLink>
      </nav>
      <Routes>
        <Route index element={<ProductList />} />
        <Route path="produtos/novo" element={<ProductForm />} />
        <Route path="produtos/:id" element={<ProductForm />} />
        <Route path="pedidos" element={<OrderList />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </PageLayout>
  );
};

export default AdminPage;
