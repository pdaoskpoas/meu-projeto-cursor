// src/services/planService.ts

import { supabase } from '@/lib/supabase';
import { log, captureError } from '@/utils/logger';

export interface PlanQuota {
  plan: string;
  planIsValid: boolean;
  remaining: number;
  allowedByPlan: number;
  active: number;
  planExpiresAt: string | null;
}

interface PlanCache {
  data: PlanQuota;
  timestamp: number;
  userId: string;
}

// Cache global (persiste entre renders)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let planCache: PlanCache | null = null;

/**
 * Limpar cache (usado em logout, mudança de plano, etc)
 */
export function clearPlanCache() {
  planCache = null;
  sessionStorage.removeItem('planQuotaCache');
  // Limpar também possíveis caches antigos/corrompidos
  sessionStorage.removeItem('planDataCache');
  sessionStorage.removeItem('planDataCache_undefined');
  // Limpar todos os caches de usuário
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('planDataCache_') || key.startsWith('planQuotaCache')) {
      sessionStorage.removeItem(key);
    }
  });
  log('[PlanService] Cache limpo completamente');
}

/**
 * Obter quota do plano do usuário
 * ✅ Cache agressivo de 5 minutos
 * ✅ Cache em memória + sessionStorage
 * ✅ Retry automático
 */
export async function getUserPlanQuota(userId: string): Promise<PlanQuota> {
  const isAuthError = (error: unknown) => {
    const err = error as { status?: number; message?: string };
    const message = err?.message?.toLowerCase() || '';
    return (
      err?.status === 401 ||
      err?.status === 403 ||
      message.includes('jwt') ||
      message.includes('token') ||
      message.includes('not authorized') ||
      message.includes('permission')
    );
  };

  const fetchQuota = async () => {
    const rpcPromise = supabase.rpc('check_user_publish_quota', {
      p_user_id: userId
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao verificar plano (10s)')), 10000)
    );
    
    return Promise.race([rpcPromise, timeoutPromise]);
  };

  // 1. Verificar cache em memória
  if (planCache && planCache.userId === userId) {
    const age = Date.now() - planCache.timestamp;
    if (age < CACHE_DURATION) {
      log(`[PlanService] Cache hit (memória) - idade: ${Math.floor(age / 1000)}s`);
      return planCache.data;
    }
  }

  // 2. Verificar cache em sessionStorage
  try {
    const cached = sessionStorage.getItem('planQuotaCache');
    if (cached) {
      const parsed: PlanCache = JSON.parse(cached);
      if (
        parsed.userId === userId &&
        Date.now() - parsed.timestamp < CACHE_DURATION
      ) {
        log(`[PlanService] Cache hit (sessionStorage)`);
        // Atualizar cache em memória
        planCache = parsed;
        return parsed.data;
      }
    }
  } catch (error) {
    log('[PlanService] Erro ao ler cache do sessionStorage');
  }

  // 3. Buscar do Supabase (com timeout de 10 segundos)
  log('[PlanService] Cache miss - buscando do Supabase...');

  try {
    let result = await fetchQuota();
    let { data, error } = result as { data: { isValid: boolean; reason: string } | null; error: Error | null };

    if (error && isAuthError(error)) {
      log('[PlanService] Sessão expirada, tentando renovar...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session) {
        throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
      }
      
      result = await fetchQuota();
      ({ data, error } = result as { data: { isValid: boolean; reason: string } | null; error: Error | null });
    }

    if (error) throw error;

    // 🔍 DEBUG: Log da resposta bruta
    log('[PlanService] Resposta bruta do Supabase:', data);

    // Parsear resposta (corrigido para snake_case com underscore)
    const planData: PlanQuota = {
      plan: data.plan || 'free',
      planIsValid: data.plan_is_valid || false,  // ✅ CORRIGIDO!
      remaining: data.remaining || 0,
      allowedByPlan: data.allowedByPlan || 0,
      active: data.active || 0,
      planExpiresAt: data.plan_expires_at || null  // ✅ CORRIGIDO!
    };

    // Salvar em ambos os caches
    const cacheEntry: PlanCache = {
      data: planData,
      timestamp: Date.now(),
      userId
    };

    planCache = cacheEntry;
    
    try {
      sessionStorage.setItem('planQuotaCache', JSON.stringify(cacheEntry));
    } catch (error) {
      log('[PlanService] Erro ao salvar cache no sessionStorage');
    }

    log('[PlanService] Dados carregados e em cache:', planData);
    return planData;

  } catch (error: unknown) {
    captureError(error, { context: 'getUserPlanQuota', userId });
    const message = error instanceof Error ? error.message : 'Erro ao verificar plano';
    if (isAuthError(error)) {
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }
    if (message.includes('Timeout')) {
      throw new Error('Tempo limite ao verificar o plano. Tente novamente em instantes.');
    }
    throw new Error(`Não foi possível verificar seu plano agora. ${message}`);
  }
}

/**
 * Pre-carregar quota do plano (silenciosamente)
 * Usado ao abrir o wizard para ter dados prontos no Step 6
 */
export async function prefetchUserPlanQuota(userId: string): Promise<void> {
  try {
    log('[PlanService] Pre-fetch iniciado');
    await getUserPlanQuota(userId);
  } catch (error) {
    // Silenciar erro no prefetch (não bloquear UX)
    log('[PlanService] Erro no prefetch (silenciado)');
  }
}

/**
 * Verificar se pode publicar (validação rápida)
 */
export function canPublish(quota: PlanQuota): boolean {
  return quota.planIsValid && quota.remaining > 0;
}

/**
 * Obter mensagem de status do plano
 */
export function getPlanStatusMessage(quota: PlanQuota): string {
  if (!quota.planIsValid) {
    return 'Plano expirado ou inválido';
  }
  
  if (quota.remaining <= 0) {
    return `Limite atingido (${quota.active}/${quota.allowedByPlan})`;
  }

  return `${quota.remaining} de ${quota.allowedByPlan} vagas disponíveis`;
}

