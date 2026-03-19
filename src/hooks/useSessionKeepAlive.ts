import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureActiveSession } from '@/services/sessionService';

/**
 * Garante que a sessão Supabase esteja sempre fresca, mesmo durante
 * períodos de inatividade de 30+ minutos. Usa o sessionService
 * centralizado (com mutex) para evitar refreshes simultâneos.
 *
 * Deve ser montado uma vez no nível do App (dentro do AuthProvider).
 */

const PROACTIVE_REFRESH_MARGIN_MS = 5 * 60_000; // Refresh 5min antes de expirar
const MIN_REFRESH_INTERVAL_MS = 60_000; // Mínimo 60s entre refreshes
const IDLE_CHECK_INTERVAL_MS = 60_000; // Checa a cada 60s

export const useSessionKeepAlive = () => {
  const lastRefreshRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const refreshIfNeeded = async () => {
      const now = Date.now();

      // Throttle: não fazer refresh com menos de 60s do último
      if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const expiresAt = (session.expires_at ?? 0) * 1000;
        const timeUntilExpiry = expiresAt - now;

        // Se faltam menos de 5 minutos para expirar, refresh via sessionService
        // O sessionService tem mutex — evita refreshes simultâneos
        if (timeUntilExpiry < PROACTIVE_REFRESH_MARGIN_MS) {
          await ensureActiveSession({ forceRefresh: true, timeoutMs: 10000 });
          lastRefreshRef.current = Date.now();
        }
      } catch {
        // Silencioso — o retry normal vai cuidar se der erro
      }
    };

    // Checar periodicamente
    timerRef.current = setInterval(refreshIfNeeded, IDLE_CHECK_INTERVAL_MS);

    // Checar imediatamente ao montar
    refreshIfNeeded();

    // Ao voltar à aba, verificar se precisa refresh
    // Usa debounce para evitar múltiplas chamadas (focus + visibility disparam juntos)
    let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Debounce de 1s para evitar chamadas duplicadas (focus + visibility)
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          refreshIfNeeded();
        }, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
};
