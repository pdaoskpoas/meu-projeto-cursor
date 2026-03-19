// src/services/planService.ts

import { supabase } from '@/lib/supabase';
import { log, captureError } from '@/utils/logger';
import { ensureActiveSession, refreshActiveSession } from '@/services/sessionService';

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

interface GetUserPlanQuotaOptions {
  forceFresh?: boolean;
}

interface QuotaRpcData {
  plan?: string;
  plan_is_valid?: boolean;
  remaining?: number;
  allowedByPlan?: number;
  allowed_by_plan?: number;
  active?: number;
  plan_expires_at?: string | null;
  isValid?: boolean;
  reason?: string;
}

interface QuotaRpcResult {
  data: QuotaRpcData | null;
  error: Error | null;
}

// Cache global (persiste entre renders)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let planCache: PlanCache | null = null;

function getCachedPlanForUser(userId: string): PlanQuota | null {
  if (planCache?.userId === userId) {
    return planCache.data;
  }

  try {
    const cached = sessionStorage.getItem('planQuotaCache');
    if (!cached) return null;

    const parsed: PlanCache = JSON.parse(cached);
    return parsed.userId === userId ? parsed.data : null;
  } catch {
    return null;
  }
}

function mapPlanErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const raw = error.message || '';
    const lower = raw.toLowerCase();

    if (lower.includes('timeout')) {
      return 'Tempo limite ao verificar o plano. Tente novamente em instantes.';
    }

    if (lower.includes('jwt') || lower.includes('token') || lower.includes('not authorized')) {
      return 'Sua sessão expirou. Faça login novamente para continuar.';
    }

    if (lower.includes("reading 'rest'") || lower.includes('failed to fetch') || lower.includes('network')) {
      return 'Não foi possível conectar ao servidor para verificar o plano.';
    }
  }

  return 'Não foi possível verificar seu plano agora. Tente novamente.';
}

function isTransientPlanError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes("reading 'rest'") ||
    message.includes('fetch')
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
export async function getUserPlanQuota(
  userId: string,
  options: GetUserPlanQuotaOptions = {}
): Promise<PlanQuota> {
  const { forceFresh = false } = options;
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
    const rpcCall = supabase.rpc.bind(supabase) as unknown as (
      fn: string,
      params: Record<string, unknown>
    ) => Promise<QuotaRpcResult>;

    const rpcPromise = rpcCall('check_user_publish_quota', {
      p_user_id: userId
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao verificar plano (15s)')), 15000)
    );
    
    return Promise.race([rpcPromise, timeoutPromise]);
  };

  const fetchQuotaWithRetry = async (maxRetries = 1) => {
    let attempt = 0;
    while (true) {
      try {
        const result = await fetchQuota();
        if (result.error && isTransientPlanError(result.error) && attempt < maxRetries) {
          attempt += 1;
          log(`[PlanService] Erro transitório ao verificar plano. Retry ${attempt}/${maxRetries}...`);
          await sleep(500 * attempt);
          continue;
        }
        return result;
      } catch (error) {
        if (isTransientPlanError(error) && attempt < maxRetries) {
          attempt += 1;
          log(`[PlanService] Exceção transitória ao verificar plano. Retry ${attempt}/${maxRetries}...`);
          await sleep(500 * attempt);
          continue;
        }
        throw error;
      }
    }
  };

  // 1. Verificar cache em memória
  if (!forceFresh && planCache && planCache.userId === userId) {
    const age = Date.now() - planCache.timestamp;
    if (age < CACHE_DURATION) {
      log(`[PlanService] Cache hit (memória) - idade: ${Math.floor(age / 1000)}s`);
      return planCache.data;
    }
  }

  // 2. Verificar cache em sessionStorage
  try {
    const cached = forceFresh ? null : sessionStorage.getItem('planQuotaCache');
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
    await ensureActiveSession({ timeoutMs: 5000 });

    let result = await fetchQuotaWithRetry(1);
    let { data, error } = result;

    if (error && isAuthError(error)) {
      log('[PlanService] Sessão expirada, tentando renovar...');
      await refreshActiveSession(5000);
      
      result = await fetchQuotaWithRetry(1);
      ({ data, error } = result);
    }

    if (error) throw error;
    if (!data) throw new Error('Resposta vazia ao verificar plano');

    // 🔍 DEBUG: Log da resposta bruta
    log('[PlanService] Resposta bruta do Supabase:', data);

    // Parsear resposta (corrigido para snake_case com underscore)
    const planData: PlanQuota = {
      plan: data.plan || 'free',
      planIsValid: data.plan_is_valid || false,  // ✅ CORRIGIDO!
      remaining: data.remaining || 0,
      allowedByPlan: data.allowedByPlan || data.allowed_by_plan || 0,
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

    // Usar cache como fallback apenas se não expirou e não é erro de auth
    if (!isAuthError(error)) {
      const fallbackQuota = getCachedPlanForUser(userId);
      if (fallbackQuota) {
        log('[PlanService] Falha na verificação do plano. Usando cache como fallback.');
        return fallbackQuota;
      }
    }

    if (isAuthError(error)) {
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }
    // Propagar erro real em vez de fallback silencioso com plano free
    throw new Error(mapPlanErrorMessage(error));
  }
}

/**
 * Pre-carregar quota do plano (silenciosamente)
 * Usado ao abrir o wizard para ter dados prontos no Step 6
 */
export async function prefetchUserPlanQuota(
  userId: string,
  options: GetUserPlanQuotaOptions = {}
): Promise<void> {
  try {
    log('[PlanService] Pre-fetch iniciado');
    await getUserPlanQuota(userId, options);
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

