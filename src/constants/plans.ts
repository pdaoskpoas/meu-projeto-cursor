/**
 * Constantes centralizadas para planos e limites de anúncios.
 *
 * IMPORTANTE:
 * - Limites são para anúncios ATIVOS simultaneamente (não acumulam mês a mês).
 * - Anúncios individuais pagos NÃO consomem cota do plano.
 */

export const PLAN_LIMITS = {
  free: 0,
  basic: 10,
  pro: 15,
  ultra: 25,
  vip: 15
} as const;

export const PLAN_NAMES = {
  free: 'Gratuito',
  basic: 'Plano Iniciante',
  pro: 'Plano Pro',
  ultra: 'Plano Elite',
  vip: 'VIP (Cortesia)'
} as const;

export const PLAN_DESCRIPTIONS = {
  free: 'Sem anúncios incluídos. Pague individualmente por anúncio (30 dias).',
  basic: 'Mantenha até 10 anúncios ativos simultaneamente durante todo o mês.',
  pro: 'Mantenha até 15 anúncios ativos simultaneamente durante todo o mês.',
  ultra: 'Mantenha até 25 anúncios ativos simultaneamente durante todo o mês.',
  vip: 'Plano cortesia com benefícios do Pro, concedido exclusivamente pelo administrador.'
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

const ANNUAL_SUFFIX = '_annual';

const isKnownPlan = (plan: string | null | undefined): plan is PlanType => {
  if (!plan) return false;
  return Object.prototype.hasOwnProperty.call(PLAN_LIMITS, plan);
};

/**
 * Normaliza identificadores de plano (ex.: basic_annual -> basic).
 */
export const normalizePlanId = (plan: string | null | undefined): PlanType | null => {
  if (!plan) return null;

  const lower = plan.toLowerCase();
  const sanitized = lower.endsWith(ANNUAL_SUFFIX)
    ? lower.slice(0, -ANNUAL_SUFFIX.length)
    : lower;

  return isKnownPlan(sanitized) ? (sanitized as PlanType) : null;
};

/**
 * Verifica se um plano é pago (requer assinatura)
 */
export const isPaidPlan = (plan: string | null | undefined): boolean => {
  const normalized = normalizePlanId(plan);
  return normalized === 'basic' || normalized === 'pro' || normalized === 'ultra';
};

/**
 * Verifica se um plano é concedido apenas por admin
 */
export const isAdminOnlyPlan = (plan: string | null | undefined): boolean => {
  return normalizePlanId(plan) === 'vip';
};

/**
 * Retorna o limite de anúncios para um plano
 */
export const getPlanLimit = (plan: string | PlanType | null | undefined): number => {
  const normalized = normalizePlanId(plan);
  if (!normalized) {
    return PLAN_LIMITS.free;
  }
  return PLAN_LIMITS[normalized] ?? PLAN_LIMITS.free;
};

