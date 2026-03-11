import { supabase } from '@/lib/supabase';

interface EnsureSessionOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export async function refreshActiveSession(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const refreshPromise = supabase.auth.refreshSession();
  const { data, error } = await withTimeout(
    refreshPromise,
    timeoutMs,
    'Tempo limite ao renovar sessão. Tente novamente.'
  );

  if (error || !data.session) {
    throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
  }

  return data.session;
}

export async function ensureActiveSession(
  options: EnsureSessionOptions = {}
) {
  const { forceRefresh = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  if (forceRefresh) {
    return refreshActiveSession(timeoutMs);
  }

  const sessionPromise = supabase.auth.getSession();
  const { data, error } = await withTimeout(
    sessionPromise,
    timeoutMs,
    'Tempo limite ao validar sessão. Tente novamente.'
  );
  const session = data.session;

  if (error || !session) {
    return refreshActiveSession(timeoutMs);
  }

  // Evita refresh agressivo em foco/troca de rota.
  // O refresh explícito fica apenas para operações críticas.
  return session;
}
