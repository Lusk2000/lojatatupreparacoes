import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Footer from './Footer';
import CartLink from './CartLink';

// Cabeçalho simples das páginas internas (produto, login, conta).
const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="bg-[#111111] text-white min-h-screen flex flex-col">
      <header className="h-14 md:h-[68px] flex items-center border-b border-white/10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Voltar ao início - Tatu Preparações">
            <img
              src="/media/logo.webp"
              alt="Tatu Preparações"
              className="h-10 md:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-gray-300">
            <Link to="/" className="hover:text-white">Loja</Link>
            <Link to={user ? '/minha-conta' : '/entrar'} className="hover:text-white">
              {user ? 'Minha conta' : 'Entrar'}
            </Link>
            <CartLink />
          </nav>
        </div>
      </header>
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
      <Footer />
    </div>
  );
};

export default PageLayout;
