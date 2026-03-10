// 🔥 VERSÃO 2: Hook Otimizado SEM LOOPS INFINITOS
// Correção dos problemas de dependências circulares

import { useState, useEffect, useCallback, useRef } from 'react';
import { animalService } from '@/services/animalService';

// 🔧 Constantes configuráveis
const DEFAULT_CACHE_TIME = 30000; // 30 segundos
const DEFAULT_DEBOUNCE_TIME = 300; // 300ms

// 🔧 Cache key isolada por usuário
const CACHE_KEY_BASE = 'planDataCache';
const getCacheKey = (userId: string) => `${CACHE_KEY_BASE}_${userId}`;

// 🔧 Logger condicional
const logger = {
  log: (...args: unknown[]) => import.meta.env.DEV && console.log('[usePlanVerification]', ...args),
  error: (...args: unknown[]) => import.meta.env.DEV && console.error('[usePlanVerification]', ...args),
};

// 🔧 Proteção SSR
const isBrowser = typeof window !== 'undefined';

export interface PlanData {
  plan: string | null;
  planIsValid: boolean;
  remaining: number;
  planExpiresAt: string | null;
  allowedByPlan: number;
  active: number;
}

export type PlanScenario = 'free_or_no_plan' | 'plan_with_quota' | 'plan_limit_reached' | 'plan_expired';

interface UsePlanVerificationOptions {
  userId: string | undefined;
  prefetch?: boolean;
  cacheTime?: number;
  debounceTime?: number;
}

interface UsePlanVerificationReturn {
  planData: PlanData | null;
  scenario: PlanScenario;
  loading: boolean;
  error: string | null;
  fromCache?: boolean;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export const usePlanVerification = (options: UsePlanVerificationOptions): UsePlanVerificationReturn => {
  const {
    userId,
    prefetch = false,
    cacheTime = DEFAULT_CACHE_TIME,
    debounceTime = DEFAULT_DEBOUNCE_TIME
  } = options;

  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean | undefined>(undefined);

  // ✅ FIX: Refs para evitar loops
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ✅ FIX: Armazenar cacheTime em ref para evitar recriações
  const cacheTimeRef = useRef(cacheTime);
  const debounceTimeRef = useRef(debounceTime);

  // Atualizar refs quando props mudarem
  useEffect(() => {
    cacheTimeRef.current = cacheTime;
    debounceTimeRef.current = debounceTime;
  }, [cacheTime, debounceTime]);

  /**
   * ✅ FIX: Funções de cache SEM dependências externas
   */
  const loadFromCache = useRef((userId: string): PlanData | null => {
    if (!isBrowser) return null;
    
    try {
      const cacheKey = getCacheKey(userId);
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < cacheTimeRef.current && data) {
        logger.log(`⚡ Cache HIT para ${userId} (${(age / 1000).toFixed(1)}s)`);
        return data;
      }

      logger.log(`⏱️ Cache EXPIRED para ${userId}`);
      sessionStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      logger.error('❌ Erro ao ler cache:', error);
      return null;
    }
  }).current;

  const saveToCache = useRef((userId: string, data: PlanData) => {
    if (!isBrowser) return;
    
    try {
      const cacheKey = getCacheKey(userId);
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      logger.log(`💾 Cache salvo para ${userId}`);
    } catch (error) {
      logger.error('❌ Erro ao salvar cache:', error);
    }
  }).current;

  /**
   * ✅ FIX: fetchPlanData SEM dependências problemáticas
   */
  const fetchPlanData = useCallback(async (silent = false) => {
    if (!userId || !isBrowser) {
      if (!prefetch && isMountedRef.current) {
        setLoading(false);
        setError(null);
        setFromCache(undefined);
      }
      return;
    }

    // ✅ Guard contra chamadas simultâneas
    if (fetchingRef.current) {
      logger.log('⚠️ Chamada ignorada: já buscando dados');
      return;
    }

    fetchingRef.current = true;
    
    if (!prefetch && !silent && isMountedRef.current) {
      setLoading(true);
      setError(null);
      setFromCache(undefined);
    }

    try {
      // 1️⃣ Tentar cache primeiro
      const cachedData = loadFromCache(userId);
      if (cachedData) {
        if (isMountedRef.current) {
          setPlanData(cachedData);
          if (!prefetch) {
            setLoading(false);
            setFromCache(true);
          }
        }
        return;
      }

      // 2️⃣ Buscar do servidor
      logger.log('🌐 Buscando do servidor...');
      const result = await animalService.canPublishByPlan(userId);

      if (!isMountedRef.current) return;

      const planInfo: PlanData = {
        plan: result.plan || null,
        planIsValid: result.planIsValid || false,
        remaining: result.remaining || 0,
        planExpiresAt: result.planExpiresAt || null,
        allowedByPlan: result.allowedByPlan || 0,
        active: result.active || 0
      };

      setPlanData(planInfo);
      setFromCache(false);
      saveToCache(userId, planInfo);
      
      if (!prefetch) {
        setLoading(false);
      }

      logger.log('✅ Dados carregados:', planInfo);

    } catch (err: unknown) {
      logger.error('❌ Erro:', err);

      if (isMountedRef.current && !prefetch) {
        setError(err.message || 'Erro ao verificar plano');
        setLoading(false);
        setFromCache(undefined);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [userId, prefetch, loadFromCache, saveToCache]);

  /**
   * Calcular cenário
   */
  const getScenario = useCallback((): PlanScenario => {
    if (!planData) return 'free_or_no_plan';
    if (!planData.plan || planData.plan === 'free') return 'free_or_no_plan';
    if (!planData.planIsValid) return 'plan_expired';
    if (planData.remaining > 0) return 'plan_with_quota';
    return 'plan_limit_reached';
  }, [planData]);

  /**
   * Refetch manual
   */
  const refetch = useCallback(async () => {
    if (userId && isBrowser) {
      const cacheKey = getCacheKey(userId);
      sessionStorage.removeItem(cacheKey);
    }
    await fetchPlanData(false);
  }, [userId, fetchPlanData]);

  /**
   * Limpar cache
   */
  const clearCache = useCallback(() => {
    if (userId && isBrowser) {
      const cacheKey = getCacheKey(userId);
      sessionStorage.removeItem(cacheKey);
      logger.log(`🧹 Cache limpo para ${userId}`);
      if (isMountedRef.current) {
        setPlanData(null);
        setFromCache(undefined);
      }
    }
  }, [userId]);

  /**
   * ✅ FIX: useEffect com APENAS fetchPlanData nas dependências
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (userId) {
      // Debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchPlanData(prefetch);
      }, debounceTimeRef.current);
    } else {
      if (isMountedRef.current) {
        setPlanData(null);
        setLoading(false);
        setError(null);
        setFromCache(undefined);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userId, fetchPlanData, prefetch]); // ✅ FIX: Dependências corretas

  return {
    planData,
    scenario: getScenario(),
    loading,
    error,
    fromCache,
    refetch,
    clearCache,
  };
};



