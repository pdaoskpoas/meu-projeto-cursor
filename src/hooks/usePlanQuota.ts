// src/hooks/usePlanQuota.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserPlanQuota, type PlanQuota } from '@/services/planService';
import { log } from '@/utils/logger';

const PLAN_FETCH_TIMEOUT_MS = 20000; // 20s timeout máximo para buscar plano

interface UsePlanQuotaOptions {
  userId?: string;
  enabled?: boolean;
}

interface UsePlanQuotaResult {
  quota: PlanQuota | null;
  loading: boolean;
  error: string | null;
  refetch: (options?: { forceFresh?: boolean }) => Promise<PlanQuota | null>;
}

/**
 * Hook otimizado para verificação de plano
 * - Cache automático de 5 minutos
 * - Timeout de 20s contra loading infinito
 * - Loading apenas na primeira vez
 */
export function usePlanQuota({
  userId,
  enabled = true
}: UsePlanQuotaOptions = {}): UsePlanQuotaResult {
  const [quota, setQuota] = useState<PlanQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchQuota = useCallback(async (
    options?: { forceFresh?: boolean }
  ): Promise<PlanQuota | null> => {
    if (!userId) return null;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Timeout de segurança contra loading infinito
      const data = await Promise.race([
        getUserPlanQuota(userId, options),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite ao verificar seu plano. Tente novamente.')), PLAN_FETCH_TIMEOUT_MS)
        )
      ]);
      if (isMountedRef.current) {
        setQuota(data);
      }
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar plano';
      if (isMountedRef.current) {
        setError(message);
      }
      log('[usePlanQuota] Erro:', err);
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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



