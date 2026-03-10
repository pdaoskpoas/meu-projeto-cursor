export type CheckoutPlanId = 'basic' | 'pro' | 'ultra';
export type CheckoutBillingCycle = 'monthly' | 'semiannual' | 'annual';

export interface CheckoutPlan {
  id: CheckoutPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  semiannualTotal: number;
  annualTotal: number;
  highlights: string[];
  popular?: boolean;
}

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  {
    id: 'basic',
    name: 'Iniciante',
    description: 'Para quem está começando',
    monthlyPrice: 97,
    semiannualTotal: 97 * 6,
    annualTotal: 776,
    highlights: [
      'Até 10 anúncios ativos',
      'Aparece no mapa interativo',
      'Perfil completo com link para Instagram',
      'Sistema completo de sociedades',
      'Relatórios de visualização',
      'Suporte por e-mail e tickets',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Mais vendido',
    monthlyPrice: 147,
    semiannualTotal: 147 * 6,
    annualTotal: 882,
    highlights: [
      'Até 15 anúncios ativos',
      'Destaque nos resultados',
      'Aparece no topo do mapa interativo',
      'Perfil avançado verificado',
      'Link para Instagram e WhatsApp',
      'Sistema completo de sociedades',
      'Relatórios detalhados de performance',
      'Suporte prioritário por e-mail e tickets',
      '2 turbinares grátis por mês',
    ],
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Elite',
    description: 'Para quem quer o máximo',
    monthlyPrice: 247,
    semiannualTotal: 247 * 6,
    annualTotal: 1482,
    highlights: [
      'Até 25 anúncios ativos',
      'Máxima visibilidade e destaque',
      'Posição privilegiada no mapa',
      'Perfil Elite com selo premium',
      'Integração completa com redes sociais',
      'Sistema completo de sociedades',
      'Analytics avançados e insights',
      'Suporte VIP dedicado',
      'Consultoria de marketing digital',
      '5 turbinares grátis por mês',
    ],
  },
];

export const getPlanById = (planId: string | null | undefined): CheckoutPlan | null => {
  if (!planId) return null;
  return CHECKOUT_PLANS.find((plan) => plan.id === planId) ?? null;
};

export const getPlanPrice = (plan: CheckoutPlan, cycle: CheckoutBillingCycle): number => {
  if (cycle === 'monthly') return plan.monthlyPrice;
  if (cycle === 'semiannual') return plan.semiannualTotal;
  return plan.annualTotal;
};

export const getInstallmentCount = (cycle: CheckoutBillingCycle): number => {
  if (cycle === 'semiannual') return 6;
  if (cycle === 'annual') return 12;
  return 1;
};
