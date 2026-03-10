import { Target, TrendingUp, Crown } from 'lucide-react';

export interface Plan {
  id: string;
  name: string;
  monthlyDiscount: number;
  annualDiscount: number;
  ads: number;
  monthlyBasePrice: number;
  monthlyPrice: number;
  annualPrice: number;
  annualInstallments: number;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular: boolean;
}

export const usePlansData = () => {
  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Plano Iniciante',
      monthlyDiscount: 30,
      annualDiscount: 45,
      ads: 10,
      monthlyBasePrice: 138.57, // Preço original mensal
      monthlyPrice: 97.00, // Preço com 30% de desconto mensal
      annualPrice: 914.52, // (138.57 × 0.55) × 12
      annualInstallments: 76.21, // 138.57 × 0.55
      features: [
        'Mantenha até 10 anúncios ativos simultaneamente',
        'Aparece no mapa interativo',
        'Perfil completo com link para Instagram',
        'Relatórios de visualização',
        'Suporte por e-mail e tickets',
        'Economize 45% no plano anual'
      ],
      icon: Target,
      color: 'blue',
      popular: false
    },
    {
      id: 'pro',
      name: 'Plano Pro',
      monthlyDiscount: 45,
      annualDiscount: 55,
      ads: 15,
      monthlyBasePrice: 267.27, // Preço original mensal
      monthlyPrice: 147.00, // Preço com 45% de desconto mensal
      annualPrice: 1443.24, // (267.27 × 0.45) × 12
      annualInstallments: 120.27, // 267.27 × 0.45
      features: [
        'Mantenha até 15 anúncios ativos simultaneamente',
        'Destaque PREMIUM nos resultados',
        'Aparece no topo do mapa interativo',
        'Perfil verificado com selo premium',
        'Link para Instagram e WhatsApp',
        'Relatórios detalhados de performance',
        'Suporte prioritário por WhatsApp',
        'Sistema de sociedades',
        'Economize 55% no plano anual'
      ],
      icon: TrendingUp,
      color: 'orange',
      popular: true
    },
    {
      id: 'ultra',
      name: 'Plano Elite',
      monthlyDiscount: 55,
      annualDiscount: 65,
      ads: 25,
      monthlyBasePrice: 548.89, // Preço original mensal
      monthlyPrice: 247.00, // Preço com 55% de desconto mensal
      annualPrice: 2305.32, // (548.89 × 0.35) × 12
      annualInstallments: 192.11, // 548.89 × 0.35
      features: [
        'Mantenha até 25 anúncios ativos simultaneamente',
        'Máxima visibilidade e destaque',
        'Posição privilegiada no mapa',
        'Perfil premium com múltiplos contatos',
        'Integração completa com redes sociais',
        'Analytics avançados e insights',
        'Suporte VIP dedicado',
        'Sistema completo de sociedades',
        'Consultoria de marketing digital',
        'Economize 65% no plano anual'
      ],
      icon: Crown,
      color: 'emerald',
      popular: false
    }
  ];

  return { plans };
};




