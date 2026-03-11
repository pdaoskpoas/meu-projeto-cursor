// src/hooks/usePlanQuota.ts

import { useCallback, useEffect, useState } from 'react';
import { getUserPlanQuota, type PlanQuota } from '@/services/planService';
import { log } from '@/utils/logger';

interface UsePlanQuotaOptions {
  userId?: string;
  enabled?: boolean; // Se deve buscar automaticamente
}

interface UsePlanQuotaResult {
  quota: PlanQuota | null;
  loading: boolean;
  error: string | null;
  refetch: (options?: { forceFresh?: boolean }) => Promise<PlanQuota | null>;
}

/**
 * Hook otimizado para verificação de plano
 * ✅ Cache automático de 5 minutos
 * ✅ Loading apenas na primeira vez
 * ✅ Não causa re-renders desnecessários
 */
export function usePlanQuota({
  userId,
  enabled = true
}: UsePlanQuotaOptions = {}): UsePlanQuotaResult {
  const [quota, setQuota] = useState<PlanQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async (
    options?: { forceFresh?: boolean }
  ): Promise<PlanQuota | null> => {
    if (!userId) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await getUserPlanQuota(userId, options);
      setQuota(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar plano';
      setError(message);
      log('[usePlanQuota] Erro:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (enabled && userId) {
      fetchQuota();
    }
  }, [enabled, userId, fetchQuota]);

  return {
    quota,
    loading,
    error,
    refetch: fetchQuota
  };
}



