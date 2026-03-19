import { supabase } from '@/lib/supabase';
import { ensureActiveSession } from '@/services/sessionService';

/**
 * Wrapper que garante sessão Supabase válida antes de executar uma query.
 * Usa o sessionService centralizado (com mutex) para evitar refreshes
 * simultâneos que causam timeout.
 *
 * Se o token estiver prestes a expirar, faz refresh antes da query.
 * Se a query falhar com erro de auth, faz refresh e retenta uma vez.
 */

const TOKEN_REFRESH_THRESHOLD_MS = 30_000;

async function ensureValidToken(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // Não logado — queries públicas passam sem token

  const expiresAt = (session.expires_at ?? 0) * 1000;
  const timeLeft = expiresAt - Date.now();

  if (timeLeft < TOKEN_REFRESH_THRESHOLD_MS) {
    // Usa sessionService com mutex — evita refreshes simultâneos
    await ensureActiveSession({ forceRefresh: true, timeoutMs: 10000 });
  }
}

function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = ((error as Record<string, unknown>).message as string || '').toLowerCase();
  const code = (error as Record<string, unknown>).code as string || '';
  return (
    msg.includes('jwt') ||
    msg.includes('token') ||
    msg.includes('session') ||
    msg.includes('unauthorized') ||
    code === 'PGRST301' ||
    code === '401'
  );
}

export async function queryWithSession<T>(queryFn: () => Promise<T>): Promise<T> {
  // Garantir token válido antes da query
  await ensureValidToken();

  try {
    return await queryFn();
  } catch (error) {
    // Se for erro de auth, tenta refresh + retry uma vez
    if (isAuthError(error)) {
      try {
        await ensureActiveSession({ forceRefresh: true, timeoutMs: 10000 });
        return await queryFn();
      } catch {
        // Se falhar de novo, propagar o erro original
      }
    }
    throw error;
  }
}
