// Tipos para gerenciamento de haras do admin

export interface InstitutionalProfile {
  id: number;
  name: string;
  type: 'haras' | 'fazenda' | 'cte';
  owner: {
    id: number;
    name: string;
    email: string;
    plan: 'Free' | 'Pro' | 'Ultra' | 'VIP';
    isSuspended: boolean;
  };
  location: {
    city: string;
    state: string;
    // Coordenadas aproximadas (centro da cidade) para segurança
    approximateCoordinates: {
      lat: number;
      lng: number;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  isVisibleOnMap: boolean;
  description: string;
  facilities: string[];
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  // Informações adicionais para administradores
  adminInfo: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
  };
  rating: number;
  totalAnimals: number;
  featuredAnimals: number;
  createdAt: string;
  lastUpdate: string;
  planStatus: 'active' | 'expired' | 'expiring_soon';
  planExpiryDate: string;
}

export interface HarasFilters {
  searchTerm: string;
  stateFilter: string;
  planFilter: string;
  statusFilter: string;
  typeFilter: string;
}

export const brazilianStates = [
  'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Paraná', 'Santa Catarina',
  'Rio Grande do Sul', 'Bahia', 'Goiás', 'Pernambuco', 'Ceará'
];

export const cities = {
  'São Paulo': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
  'Rio de Janeiro': ['Rio de Janeiro', 'Niterói', 'Petrópolis', 'Nova Friburgo', 'Campos dos Goytacazes'],
  'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
  'Paraná': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
  'Santa Catarina': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma'],
  'Rio Grande do Sul': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'],
  'Bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro'],
  'Goiás': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
  'Pernambuco': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina'],
  'Ceará': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral']
};

export const harasTypes = [
  { value: 'haras', label: 'Haras' },
  { value: 'fazenda', label: 'Fazenda' },
  { value: 'cte', label: 'Centro de Treinamento' }
];

export const planTypes = [
  { value: 'Free', label: 'Free' },
  { value: 'Pro', label: 'Pro' },
  { value: 'Ultra', label: 'Ultra' },
  { value: 'VIP', label: 'VIP' }
];

export const statusTypes = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'suspended', label: 'Suspenso' }
];

