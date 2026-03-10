// Tipos compartilhados para os componentes de estatísticas do admin

export interface BoostDetail {
  id: number;
  adId: number;
  animalName: string;
  publisher: string;
  boostType: string;
  boostSource: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: string;
  views: number;
  cost: number;
}

export interface BoostedAnimal {
  adId: number;
  animalName: string;
  publisher: string;
  totalBoosts: number;
  totalViews: number;
  totalCost: number;
  lastBoostDate: string;
  isCurrentlyBoosted: boolean;
  boostDetails: BoostDetail[];
}

export interface Ad {
  id: number;
  animalName: string;
  publisher: string;
  visits: number;
  status: 'ativo' | 'pausado' | 'inativo' | 'suspenso';
  boosted: boolean;
  boostType: string | null;
  boostSource: string | null;
  publishDate: string;
  lastActivity: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  author: string;
  category: string;
  status: 'publicado' | 'rascunho' | 'agendado' | 'arquivado';
  publishDate: string;
  views: number;
  likes: number;
  shares: number;
}

export interface BoostHistory {
  id: number;
  adId: number;
  animalName: string;
  publisher: string;
  userPlan: string;
  boostType: string;
  boostSource: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: string;
  views: number;
  cost: number;
}

export interface AdminStatsProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export interface StatsData {
  totalUsers: number;
  activeUsers: number;
  totalAnimals: number;
  totalViews: number;
  totalClicks: number;
  clickRate: number;
}

