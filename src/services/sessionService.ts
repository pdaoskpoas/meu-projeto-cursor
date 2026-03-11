import { supabase } from '@/lib/supabase';
import { diagnostics } from '@/lib/diagnostics';

interface EnsureSessionOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const SESSION_SCOPE = 'session-service';

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

export async function refreshActiveSession(timeoutMs = DEFAULT_TIMEOUT_MS) {
  diagnostics.info(SESSION_SCOPE, 'Refreshing session', { timeoutMs });
  const { data, error } = await withTimeout(
    supabase.auth.refreshSession(),
    timeoutMs,
    'supabase.auth.refreshSession'
  );

  if (error || !data.session) {
    diagnostics.warn(SESSION_SCOPE, 'Session refresh failed', {
      hasError: Boolean(error),
      hasSession: Boolean(data?.session)
    });
    throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
  }

  diagnostics.debug(SESSION_SCOPE, 'Session refresh succeeded');
  return data.session;
}

export async function ensureActiveSession(
  options: EnsureSessionOptions = {}
) {
  const { forceRefresh = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  if (forceRefresh) {
    return refreshActiveSession(timeoutMs);
  }

  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    timeoutMs,
    'supabase.auth.getSession'
  );
  const session = data.session;

  if (error || !session) {
    diagnostics.warn(SESSION_SCOPE, 'No valid local session, forcing refresh', {
      hasError: Boolean(error),
      hasSession: Boolean(session)
    });
    return refreshActiveSession(timeoutMs);
  }

  diagnostics.debug(SESSION_SCOPE, 'Active session confirmed');
  return session;
}
