import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import FormField, { primaryButtonClass } from '../components/FormField';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/minha-conta';
  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return setMessage('Login indisponível no momento.');
    setIsSending(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSending(false);
    if (error) {
      setMessage(
        error.code === 'email_not_confirmed'
          ? 'Confirme seu e-mail pelo link que enviamos antes de entrar.'
          : 'E-mail ou senha incorretos.'
      );
    }
  };

  const handleReset = async () => {
    if (!supabase) return setMessage('Indisponível no momento.');
    if (!email) return setMessage('Digite seu e-mail para receber o link de nova senha.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/minha-conta`,
    });
    setMessage(
      error
        ? 'Não foi possível enviar o e-mail agora. Tente mais tarde.'
        : 'Se houver uma conta com esse e-mail, enviamos o link de nova senha.'
    );
  };

  return (
    <PageLayout>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <h1 className="text-3xl font-bold uppercase">Entrar</h1>
        <FormField label="E-mail" name="email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField label="Senha" name="password" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
        <button type="submit" disabled={isSending} className={primaryButtonClass}>
          {isSending ? 'Entrando...' : 'Entrar'}
        </button>
        <div className="flex justify-between text-sm text-gray-400">
          <button type="button" onClick={handleReset} className="hover:text-white">Esqueci a senha</button>
          <Link to="/cadastro" className="hover:text-white">Criar conta</Link>
        </div>
      </form>
    </PageLayout>
  );
};

export default LoginPage;
