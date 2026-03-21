/**
 * Constantes centralizadas para planos e limites.
 *
 * MODELO 100% BASEADO EM PLANOS:
 * - Nenhum usuário publica sem plano ativo
 * - Limites são para animais ATIVOS simultaneamente
 * - Turbinares inclusos resetam mensalmente (não acumulam)
 */

export const PLAN_LIMITS = {
  free: 0,
  essencial: 1,
  criador: 5,
  haras: 10,
  elite: 25,
  vip: 10
} as const;

export const PLAN_BOOSTS_INCLUDED = {
  free: 0,
  essencial: 0,
  criador: 2,
  haras: 5,
  elite: 10,
  vip: 0
} as const;

export const PLAN_NAMES = {
  free: 'Sem Plano',
  essencial: 'Essencial',
  criador: 'Criador',
  haras: 'Haras Destaque',
  elite: 'Elite',
  vip: 'VIP (Cortesia)'
} as const;

export const PLAN_DESCRIPTIONS = {
  free: 'Assine um plano para começar a cadastrar seus animais.',
  essencial: 'Cadastre até 1 animal ativo.',
  criador: 'Cadastre até 5 animais + 2 turbinares/mês.',
  haras: 'Cadastre até 10 animais + 5 turbinares/mês.',
  elite: 'Cadastre até 25 animais + 10 turbinares/mês.',
  vip: 'Plano cortesia (10 animais, sem turbinares grátis). Concedido pelo administrador.'
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

const ANNUAL_SUFFIX = '_annual';

const isKnownPlan = (plan: string | null | undefined): plan is PlanType => {
  if (!plan) return false;
  return Object.prototype.hasOwnProperty.call(PLAN_LIMITS, plan);
};

/**
 * Normaliza identificadores de plano (ex.: criador_annual -> criador).
 * Também mapeia planos antigos para os novos:
 *   basic -> essencial, pro -> criador, ultra -> elite
 */
export const normalizePlanId = (plan: string | null | undefined): PlanType | null => {
  if (!plan) return null;

  const lower = plan.toLowerCase();
  const sanitized = lower.endsWith(ANNUAL_SUFFIX)
    ? lower.slice(0, -ANNUAL_SUFFIX.length)
    : lower;

  // Mapeamento de planos antigos para novos
  const legacyMap: Record<string, PlanType> = {
    basic: 'essencial',
    pro: 'criador',
    ultra: 'elite'
  };

  if (legacyMap[sanitized]) {
    return legacyMap[sanitized];
  }

  return isKnownPlan(sanitized) ? (sanitized as PlanType) : null;
};

/**
 * Verifica se um plano é pago (requer assinatura)
 */
export const isPaidPlan = (plan: string | null | undefined): boolean => {
  const normalized = normalizePlanId(plan);
  return normalized === 'essencial' || normalized === 'criador' || normalized === 'haras' || normalized === 'elite';
};

/**
 * Verifica se um plano é concedido apenas por admin
 */
export const isAdminOnlyPlan = (plan: string | null | undefined): boolean => {
  return normalizePlanId(plan) === 'vip';
};

/**
 * Retorna o limite de animais para um plano
 */
export const getPlanLimit = (plan: string | PlanType | null | undefined): number => {
  const normalized = normalizePlanId(plan);
  if (!normalized) {
    return PLAN_LIMITS.free;
  }
  return PLAN_LIMITS[normalized] ?? PLAN_LIMITS.free;
};

/**
 * Retorna a quantidade de turbinares inclusos no plano por mês
 */
export const getPlanBoostsIncluded = (plan: string | PlanType | null | undefined): number => {
  const normalized = normalizePlanId(plan);
  if (!normalized) {
    return PLAN_BOOSTS_INCLUDED.free;
  }
  return PLAN_BOOSTS_INCLUDED[normalized] ?? PLAN_BOOSTS_INCLUDED.free;
};
