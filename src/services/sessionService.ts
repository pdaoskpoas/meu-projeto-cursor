import { supabase } from '@/lib/supabase';

interface EnsureSessionOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;
const REFRESH_THRESHOLD_MS = 10 * 60 * 1000;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Session timeout')), timeoutMs);
    })
  ]);

export async function refreshActiveSession(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { data, error } = await withTimeout(supabase.auth.refreshSession(), timeoutMs);

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

  const { data, error } = await withTimeout(supabase.auth.getSession(), timeoutMs);
  const session = data.session;

  if (error || !session) {
    return refreshActiveSession(timeoutMs);
  }

  const expiresAtMs = session.expires_at ? session.expires_at * 1000 : null;
  const expiresSoon = expiresAtMs ? expiresAtMs - Date.now() <= REFRESH_THRESHOLD_MS : false;

  if (expiresSoon) {
    return refreshActiveSession(timeoutMs);
  }

  return session;
}
