import { supabase } from '@/lib/supabase';
import { diagnostics } from '@/lib/diagnostics';

interface EnsureSessionOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const SESSION_SCOPE = 'session-service';

// Margem de segurança: considerar sessão "fresca" se expira em mais de 2 minutos
const SESSION_FRESH_MARGIN_MS = 2 * 60 * 1000;

// ✅ MUTEX: Apenas 1 refresh por vez para evitar conflitos
let activeRefreshPromise: Promise<unknown> | null = null;

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string
) =>
  Promise.race<T>([
    operation,
    new Promise<T>((_, reject) => {
      window.setTimeout(
        () => reject(new Error(`Timeout while waiting for ${operationName}`)),
        timeoutMs
      );
    })
  ]);

/**
 * Verifica se a sessão atual ainda é "fresca" (expira em mais de 2 min)
 */
function isSessionFresh(session: { expires_at?: number } | null): boolean {
  if (!session?.expires_at) return false;
  const expiresAtMs = session.expires_at * 1000;
  const timeUntilExpiry = expiresAtMs - Date.now();
  return timeUntilExpiry > SESSION_FRESH_MARGIN_MS;
}

export async function refreshActiveSession(timeoutMs = DEFAULT_TIMEOUT_MS) {
  // Se já existe um refresh em andamento, esperar por ele
  if (activeRefreshPromise) {
    diagnostics.debug(SESSION_SCOPE, 'Refresh already in progress, waiting...');
    try {
      await activeRefreshPromise;
      // Após o outro refresh completar, pegar a sessão atualizada
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
    } catch {
      // Se o outro refresh falhou, verificar se sessão existe mesmo assim
      // (o auth listener pode ter atualizado em background)
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && isSessionFresh(data.session)) {
          diagnostics.info(SESSION_SCOPE, 'Using existing fresh session after failed wait');
          return data.session;
        }
      } catch { /* continuar para tentar nosso próprio refresh */ }
    }
  }

  diagnostics.info(SESSION_SCOPE, 'Refreshing session', { timeoutMs });

  const refreshOp = withTimeout(
    supabase.auth.refreshSession(),
    timeoutMs,
    'supabase.auth.refreshSession'
  );

  // Registrar como refresh ativo
  activeRefreshPromise = refreshOp;

  try {
    const { data, error } = await refreshOp;

    if (error || !data.session) {
      diagnostics.warn(SESSION_SCOPE, 'Session refresh failed', {
        hasError: Boolean(error),
        hasSession: Boolean(data?.session)
      });
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }

    diagnostics.debug(SESSION_SCOPE, 'Session refresh succeeded');
    return data.session;
  } catch (refreshError) {
    // FALLBACK: Se o refresh deu timeout mas a sessão existe (auth listener
    // pode ter renovado em background via TOKEN_REFRESHED), usar ela
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        diagnostics.info(SESSION_SCOPE, 'Refresh timed out but session exists, using it', {
          expiresAt: data.session.expires_at
        });
        return data.session;
      }
    } catch { /* sem sessão, propagar erro original */ }

    throw refreshError;
  } finally {
    activeRefreshPromise = null;
  }
}

export async function ensureActiveSession(
  options: EnsureSessionOptions = {}
) {
  const { forceRefresh = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  // ✅ SEMPRE verificar sessão existente primeiro — mesmo com forceRefresh
  // Se a sessão ainda é fresca (>2min até expirar), usar direto sem refresh
  try {
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      5000, // timeout curto para getSession (é local)
      'supabase.auth.getSession'
    );

    if (data.session) {
      if (!forceRefresh || isSessionFresh(data.session)) {
        diagnostics.debug(SESSION_SCOPE, 'Session still fresh, skipping refresh', {
          expiresAt: data.session.expires_at,
          forceRefresh
        });
        return data.session;
      }
    }
  } catch {
    // getSession falhou, prosseguir para refresh
  }

  // Sessão expirada ou próxima de expirar — fazer refresh
  return refreshActiveSession(timeoutMs);
}

/**
 * Verifica se a sessão está ativa. Útil para detectar quando RLS
 * retorna resultados vazios por sessão expirada (auth.uid() = NULL).
 * Retorna true se sessão está OK, false se expirou.
 */
export async function isSessionActive(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  } catch {
    return false;
  }
}
