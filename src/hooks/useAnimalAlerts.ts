import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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

      try {
        setLoading(true);

        // Buscar animais pausados
        const { count: pausedCount } = await supabase
          .from('animals')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('ad_status', 'paused');

        // Buscar animais expirados
        const { count: expiredCount } = await supabase
          .from('animals')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('ad_status', 'expired');

        // Soma total de alertas (pausados + expirados)
        const total = (pausedCount || 0) + (expiredCount || 0);
        if (requestId !== requestIdRef.current) return;
        setAlertCount(total);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error('Erro ao buscar alertas de animais:', error);
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



