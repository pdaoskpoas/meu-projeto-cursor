export type CheckoutPlanId = 'essencial' | 'criador' | 'haras' | 'elite';
export type CheckoutBillingCycle = 'monthly' | 'annual';

export interface CheckoutPlan {
  id: CheckoutPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualTotal: number;
  animalLimit: number;
  boostsPerMonth: number;
  highlights: string[];
  popular?: boolean;
}

/**
 * Preços dos turbinares avulsos (por duração)
 */
export type BoostDuration = '24h' | '3d' | '7d';

export interface BoostTier {
  duration: BoostDuration;
  label: string;
  hours: number;
  price: number;
}

export const BOOST_TIERS: BoostTier[] = [
  { duration: '24h', label: '24 horas', hours: 24, price: 19.90 },
  { duration: '3d', label: '3 dias', hours: 72, price: 49.90 },
  { duration: '7d', label: '7 dias', hours: 168, price: 89.90 },
];

export const getBoostTier = (duration: BoostDuration): BoostTier => {
  return BOOST_TIERS.find(t => t.duration === duration) ?? BOOST_TIERS[0];
};

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    description: 'Para quem está começando',
    monthlyPrice: 37.90,
    annualTotal: 399.00,
    animalLimit: 1,
    boostsPerMonth: 0,
    highlights: [
      'Até 1 animal ativo',
      'Aparece no mapa interativo',
      'Perfil completo com link para Instagram',
      'Sistema completo de sociedades',
      'Relatórios de visualização',
      'Suporte por e-mail e tickets',
    ],
  },
  {
    id: 'criador',
    name: 'Criador',
    description: 'Para criadores em crescimento',
    monthlyPrice: 97.90,
    annualTotal: 997.00,
    animalLimit: 5,
    boostsPerMonth: 2,
    highlights: [
      'Até 5 animais ativos',
      '2 turbinares grátis por mês',
      'Destaque nos resultados',
      'Aparece no topo do mapa interativo',
      'Perfil avançado verificado',
      'Link para Instagram e WhatsApp',
      'Sistema completo de sociedades',
      'Relatórios detalhados de performance',
      'Suporte prioritário por e-mail e tickets',
    ],
  },
  {
    id: 'haras',
    name: 'Haras Destaque',
    description: 'Para haras e criadores profissionais',
    monthlyPrice: 197.90,
    annualTotal: 1997.00,
    animalLimit: 10,
    boostsPerMonth: 5,
    highlights: [
      'Até 10 animais ativos',
      '5 turbinares grátis por mês',
      'Máxima visibilidade e destaque',
      'Posição privilegiada no mapa',
      'Perfil Haras com selo premium',
      'Integração completa com redes sociais',
      'Sistema completo de sociedades',
      'Analytics avançados e insights',
      'Suporte VIP dedicado',
    ],
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Para quem quer o máximo',
    monthlyPrice: 397.90,
    annualTotal: 3997.00,
    animalLimit: 25,
    boostsPerMonth: 10,
    highlights: [
      'Até 25 animais ativos',
      '10 turbinares grátis por mês',
      'Máxima visibilidade e destaque',
      'Posição privilegiada no mapa',
      'Perfil Elite com selo exclusivo',
      'Integração completa com redes sociais',
      'Sistema completo de sociedades',
      'Analytics avançados e insights',
      'Suporte VIP dedicado',
      'Consultoria de marketing digital',
    ],
  },
];

export const getPlanById = (planId: string | null | undefined): CheckoutPlan | null => {
  if (!planId) return null;
  return CHECKOUT_PLANS.find((plan) => plan.id === planId) ?? null;
};

export const getPlanPrice = (plan: CheckoutPlan, cycle: CheckoutBillingCycle): number => {
  if (cycle === 'monthly') return plan.monthlyPrice;
  return plan.annualTotal;
};

export const getInstallmentCount = (cycle: CheckoutBillingCycle): number => {
  if (cycle === 'annual') return 12;
  return 1;
};
