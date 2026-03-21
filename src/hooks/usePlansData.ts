import { Target, TrendingUp, Crown, Gem } from 'lucide-react';

export interface Plan {
  id: string;
  name: string;
  ads: number;
  boostsPerMonth: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular: boolean;
}

export const usePlansData = () => {
  const plans: Plan[] = [
    {
      id: 'essencial',
      name: 'Essencial',
      ads: 1,
      boostsPerMonth: 0,
      monthlyPrice: 39.90,
      annualPrice: 399.00,
      features: [
        'Cadastre até 1 animal ativo',
        'Aparece no mapa interativo',
        'Perfil completo com link para Instagram',
        'Sistema completo de sociedades',
        'Relatórios de visualização',
        'Suporte por e-mail e tickets',
      ],
      icon: Target,
      color: 'blue',
      popular: false
    },
    {
      id: 'criador',
      name: 'Criador',
      ads: 5,
      boostsPerMonth: 2,
      monthlyPrice: 97.90,
      annualPrice: 997.00,
      features: [
        'Cadastre até 5 animais ativos',
        '2 turbinares grátis por mês',
        'Destaque nos resultados',
        'Aparece no topo do mapa interativo',
        'Perfil avançado verificado',
        'Link para Instagram e WhatsApp',
        'Relatórios detalhados de performance',
        'Suporte prioritário',
      ],
      icon: TrendingUp,
      color: 'orange',
      popular: false
    },
    {
      id: 'haras',
      name: 'Haras Destaque',
      ads: 10,
      boostsPerMonth: 5,
      monthlyPrice: 197.90,
      annualPrice: 1997.00,
      features: [
        'Cadastre até 10 animais ativos',
        '5 turbinares grátis por mês',
        'Máxima visibilidade e destaque',
        'Posição privilegiada no mapa',
        'Perfil Haras com selo premium',
        'Integração completa com redes sociais',
        'Analytics avançados e insights',
        'Suporte VIP dedicado',
      ],
      icon: Crown,
      color: 'emerald',
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      ads: 25,
      boostsPerMonth: 10,
      monthlyPrice: 397.90,
      annualPrice: 3997.00,
      features: [
        'Cadastre até 25 animais ativos',
        '10 turbinares grátis por mês',
        'Máxima visibilidade e destaque',
        'Posição privilegiada no mapa',
        'Perfil Elite com selo exclusivo',
        'Integração completa com redes sociais',
        'Analytics avançados e insights',
        'Suporte VIP dedicado',
        'Consultoria de marketing digital',
      ],
      icon: Gem,
      color: 'purple',
      popular: false
    }
  ];

  return { plans };
};
