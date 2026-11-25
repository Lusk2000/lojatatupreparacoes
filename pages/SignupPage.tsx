import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import FormField, { primaryButtonClass } from '../components/FormField';
import { useAuth } from '../lib/auth';
import { isValidDocument, normalizeDocument } from '../lib/documents';
import { supabase } from '../lib/supabase';

const EMPTY = { fullName: '', document: '', phone: '', email: '', password: '' };

const SignupPage: React.FC = () => {
  const { user } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (user) return <Navigate to="/minha-conta" replace />;

  const bind = (field: keyof typeof EMPTY) => ({
    name: field,
    required: true,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return setMessage('Cadastro indisponível no momento.');
    if (!isValidDocument(values.document)) return setMessage('CPF ou CNPJ inválido.');
    setIsSending(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/minha-conta`,
        data: {
          full_name: values.fullName.trim(),
          cpf_cnpj: normalizeDocument(values.document),
          phone: values.phone.trim(),
        },
      },
    });
    setIsSending(false);
    if (error) return setMessage('Não foi possível criar a conta. Confira os dados e tente de novo.');
    setIsDone(true);
  };

  return (
    <PageLayout>
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-3xl font-bold uppercase">Criar conta</h1>
        {isDone ? (
          <p className="text-gray-300">
            Enviamos um link de confirmação para <strong>{values.email}</strong>. Abra o e-mail para ativar a conta.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nome completo ou razão social" autoComplete="name" {...bind('fullName')} />
            <FormField label="CPF ou CNPJ" {...bind('document')} />
            <FormField label="Telefone com DDD" type="tel" autoComplete="tel" {...bind('phone')} />
            <FormField label="E-mail" type="email" autoComplete="email" {...bind('email')} />
            <FormField label="Senha (mínimo 8 caracteres)" type="password" minLength={8}
              autoComplete="new-password" {...bind('password')} />
            {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
            <button type="submit" disabled={isSending} className={primaryButtonClass}>
              {isSending ? 'Enviando...' : 'Criar conta'}
            </button>
            <p className="text-sm text-gray-400">
              Já tem conta? <Link to="/entrar" className="text-white underline">Entrar</Link>
            </p>
          </form>
        )}
      </div>
    </PageLayout>
  );
};

export default SignupPage;
