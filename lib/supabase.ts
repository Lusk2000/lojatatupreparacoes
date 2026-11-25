import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Nulo quando o .env.local não está preenchido: o site mostra o catálogo fixo
// e as páginas de conta avisam que estão indisponíveis.
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null;
