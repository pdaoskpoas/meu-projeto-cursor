import { supabase } from '@/lib/supabase';

interface EnsureSessionOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function refreshActiveSession(timeoutMs = DEFAULT_TIMEOUT_MS) {
  void timeoutMs;
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
  }

  return data.session;
}

export async function ensureActiveSession(
  options: EnsureSessionOptions = {}
) {
  const { forceRefresh = false } = options;
  void options.timeoutMs;

  if (forceRefresh) {
    return refreshActiveSession();
  }

  const { data, error } = await supabase.auth.getSession();
  const session = data.session;

  if (error || !session) {
    return refreshActiveSession();
  }

  // Evita refresh agressivo em foco/troca de rota.
  // O refresh explícito fica apenas para operações críticas.
  return session;
}
