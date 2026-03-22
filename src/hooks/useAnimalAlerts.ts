import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { diagnostics } from '@/lib/diagnostics';
import { runResilientRequest } from '@/services/resilientRequestService';

/**
 * Hook para contar animais que precisam de atenção do usuário.
 * 
 * Contabiliza apenas:
 * - Animais com status 'paused' (pausados pelo usuário)
 * - Animais com status 'expired' (expirados, precisam renovação)
 * 
 * Não conta animais ativos ou em outros status.
 */
export const useAnimalAlerts = () => {
  const { user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!user?.id) {
      setAlertCount(0);
      setLoading(false);
      return;
    }

    const fetchAlertCount = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      const requestId = ++requestIdRef.current;
      diagnostics.debug('hook-animal-alerts', 'Fetch started', { userId: user.id, requestId });

      try {
        setLoading(true);

        // ✅ OTIMIZAÇÃO: Buscar pausados e expirados em paralelo (são independentes)
        const [_resPaused, _resExpired] = await Promise.allSettled([
          runResilientRequest(
            async () =>
              supabase
                .from('animals')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id)
                .eq('ad_status', 'paused'),
            {
              timeoutMs: 12000,
              errorMessage: 'Falha ao buscar alertas de animais pausados.',
              requestKey: `animal-alerts:paused:${user.id}`
            }
          ),
          runResilientRequest(
            async () =>
              supabase
                .from('animals')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id)
                .eq('ad_status', 'expired'),
            {
              timeoutMs: 12000,
              errorMessage: 'Falha ao buscar alertas de animais expirados.',
              requestKey: `animal-alerts:expired:${user.id}`
            }
          )
        ]);

        const pausedCount = _resPaused.status === 'fulfilled' ? _resPaused.value.count : 0;
        const expiredCount = _resExpired.status === 'fulfilled' ? _resExpired.value.count : 0;
        if (_resPaused.status === 'rejected') console.warn('[useAnimalAlerts] paused query failed:', _resPaused.reason);
        if (_resExpired.status === 'rejected') console.warn('[useAnimalAlerts] expired query failed:', _resExpired.reason);

        // Soma total de alertas (pausados + expirados)
        const total = (pausedCount || 0) + (expiredCount || 0);
        if (requestId !== requestIdRef.current) return;
        setAlertCount(total);
        diagnostics.debug('hook-animal-alerts', 'Fetch succeeded', {
          userId: user.id,
          requestId,
          total
        });
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        diagnostics.warn('hook-animal-alerts', 'Fetch failed', error);
        setAlertCount(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchAlertCount();

    // Recarregar a cada 30 segundos
    const interval = setInterval(fetchAlertCount, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return { alertCount, loading };
};
