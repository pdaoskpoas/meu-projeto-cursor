// Mock data for the premium equestrian magazine

export interface Animal {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  coat: string;
  gender: 'Macho' | 'Fêmea';
  currentLocation: {
    city: string;
    state: string;
  };
  chip?: string;
  father?: string;
  mother?: string;
  titles: string[];
  image: string;
  harasId: string;
  harasName: string;
  views: number;
  featured: boolean;
  partnerships?: Partnership[];
  publishedDate: string;
  allowMessages?: boolean;
  adStatus: 'active' | 'expired' | 'paused';
  expiresAt?: string;
  canEdit: boolean; // Nova propriedade para controlar se pode editar
  isBoosted?: boolean; // Se está impulsionado
  boostEndTime?: string; // Quando termina o impulsionamento
}

// Compatibility alias for existing code
export type Horse = Animal;

export interface Partnership {
  harasId: string;
  harasName: string;
  publicCode: string;
  status: 'pending' | 'accepted' | 'rejected';
  percentage?: number;
}

export interface Haras {
  id: string;
  name: string;
  location: string;
  foundedYear: number;
  owner: string;
  description: string;
  instagram?: string;
  verified: boolean;
  subscription: 'free' | 'premium';
  image: string;
  coordinates: [number, number]; // [lat, lng]
  publicCode: string;
}

export const mockAnimals: Animal[] = [
  {
    id: '1',
    name: 'Estrela do Campo',
    breed: 'Mangalarga Marchador',
    birthDate: '2018-03-15',
    coat: 'Castanho',
    gender: 'Fêmea' as const,
    currentLocation: {
      city: 'Campos do Jordão',
      state: 'SP'
    },
    chip: 'BR123456789',
    father: 'Rei do Pasto',
    mother: 'Dama Dourada',
    titles: ['Campeã Nacional 2023', 'Grande Campeã Regional Sul 2022'],
    image: 'mangalarga',
    harasId: '1',
    harasName: 'Haras Vale Verde',
    views: 2543,
    featured: true,
    partnerships: [
      {
        harasId: '2',
        harasName: 'Haras Elite Racing',
        publicCode: 'HER2024',
        status: 'accepted',
        percentage: 30
      }
    ],
    publishedDate: '2024-01-15',
    allowMessages: true,
    adStatus: 'active' as const,
    expiresAt: '2024-07-15',
    canEdit: false, // Não pode editar porque foi impulsionado
    isBoosted: true,
    boostEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas no futuro
  },
  {
    id: '2',
    name: 'Thunder Storm',
    breed: 'Thoroughbred',
    birthDate: '2019-07-22',
    coat: 'Tordilho',
    gender: 'Macho' as const,
    currentLocation: {
      city: 'São Paulo',
      state: 'SP'
    },
    chip: 'BR987654321',
    father: 'Lightning Bolt',
    mother: 'Storm Queen',
    titles: ['Vencedor Derby 2023', 'Melhor Tempo 2022'],
    image: 'thoroughbred',
    harasId: '2',
    harasName: 'Haras Elite Racing',
    views: 3127,
    featured: true,
    partnerships: [],
    publishedDate: '2024-01-20',
    allowMessages: true,
    adStatus: 'expired' as const,
    expiresAt: '2024-01-20'
  },
  {
    id: '3',
    name: 'Golden Spirit',
    breed: 'Quarter Horse',
    birthDate: '2020-01-10',
    coat: 'Alazão Dourado',
    gender: 'Macho' as const,
    currentLocation: {
      city: 'Barbacena',
      state: 'MG'
    },
    father: 'Spirit of Gold',
    mother: 'Prairie Princess',
    titles: ['Campeão Jovem 2023'],
    image: 'quarter-horse',
    harasId: '3',
    harasName: 'Haras Montanha Dourada',
    views: 1876,
    featured: false,
    partnerships: [],
    publishedDate: '2024-01-25',
    allowMessages: false,
    adStatus: 'paused' as const,
    expiresAt: '2024-07-25'
  },
  {
    id: '4',
    name: 'Lua Cheia',
    breed: 'Mangalarga Marchador',
    birthDate: '2017-09-05',
    coat: 'Baio',
    gender: 'Fêmea' as const,
    currentLocation: {
      city: 'Campos do Jordão',
      state: 'SP'
    },
    father: 'Sol Nascente',
    mother: 'Estrela Polar',
    titles: ['Grande Campeã Nacional 2022', 'Melhor Marcha 2021'],
    image: 'mangalarga',
    harasId: '1',
    harasName: 'Haras Vale Verde',
    views: 2901,
    featured: false,
    partnerships: [],
    publishedDate: '2024-01-10',
    allowMessages: true,
    adStatus: 'active' as const,
    expiresAt: '2024-07-10',
    canEdit: true // Publicado recentemente (pode editar)
  }
];

// Backward compatibility
export const mockHorses = mockAnimals;

export const mockHaras: Haras[] = [
  {
    id: '1',
    name: 'Haras Vale Verde',
    location: 'Campos do Jordão, SP',
    foundedYear: 1985,
    owner: 'Roberto Silva',
    description: 'Especializado na criação de Mangalarga Marchador de alta linhagem, com foco em preservação genética e excelência na marcha.',
    instagram: '@harasvaleverde',
    verified: true,
    subscription: 'premium',
    image: 'haras-hero',
    coordinates: [-22.7395, -45.5928],
    publicCode: 'HVV2024'
  },
  {
    id: '2',
    name: 'Haras Elite Racing',
    location: 'São Paulo, SP',
    foundedYear: 1992,
    owner: 'Maria Santos',
    description: 'Criação exclusiva de Thoroughbred para corridas, com tradição em formar campeões de turfe nacional e internacional.',
    instagram: '@haraseliteracing',
    verified: true,
    subscription: 'premium',
    image: 'haras-hero',
    coordinates: [-23.5505, -46.6333],
    publicCode: 'HER2024'
  },
  {
    id: '3',
    name: 'Haras Montanha Dourada',
    location: 'Barbacena, MG',
    foundedYear: 2001,
    owner: 'João Oliveira',
    description: 'Especializado em Quarter Horse para trabalho e competições de três tambores, com genética americana importada.',
    instagram: '@harasmontanhadourada',
    verified: false,
    subscription: 'premium',
    image: 'haras-hero',
    coordinates: [-21.2259, -43.7736],
    publicCode: 'HMD2024'
  }
];

export const breedStats = [
  { breed: 'Mangalarga Marchador', count: 1847, percentage: 45 },
  { breed: 'Thoroughbred', count: 982, percentage: 24 },
  { breed: 'Quarter Horse', count: 756, percentage: 18 },
  { breed: 'Crioulo', count: 341, percentage: 8 },
  { breed: 'Outros', count: 196, percentage: 5 }
];

export interface Event {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  category: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  eventStartDate: string;
  eventStartTime?: string;
  eventEndDate: string;
  eventEndTime?: string;
  location: {
    city: string;
    state: string;
    fullAddress?: string;
  };
  registrationInfo?: string;
  registrationLink?: string;
  publicationPlan: string;
  status: 'active' | 'draft' | 'expired';
  createdAt: string;
  publishedAt?: string;
  expiresAt?: string;
  views: number;
  featured: boolean;
  harasId: string;
  harasName: string;
  canEdit: boolean; // Nova propriedade para controlar se pode editar
  isBoosted?: boolean; // Se está impulsionado
  boostEndTime?: string; // Quando termina o impulsionamento
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Copa de Marcha Diamantina 2024',
    description: 'Copa de marcha com premiação em dinheiro e troféus',
    fullDescription: 'Evento tradicional de marcha com premiação em dinheiro e troféus para os melhores conjuntos.',
    category: 'Copa de Marcha',
    registrationStartDate: '2024-03-01',
    registrationEndDate: '2024-03-15',
    eventStartDate: '2024-03-20',
    eventStartTime: '08:00',
    eventEndDate: '2024-03-22',
    eventEndTime: '18:00',
    location: {
      city: 'Diamantina',
      state: 'Minas Gerais',
      fullAddress: 'Parque de Exposições de Diamantina'
    },
    registrationInfo: 'Inscrições até 15/03/2024. Taxa: R$ 300 por conjunto.',
    registrationLink: 'https://exemplo.com/inscricoes',
    publicationPlan: 'premium',
    status: 'active',
    createdAt: '2024-02-15',
    publishedAt: '2024-02-15',
    expiresAt: '2024-03-23',
    views: 245,
    featured: true,
    harasId: '1',
    harasName: 'Haras Vale Verde',
    canEdit: false // Publicado há mais de 24h
  },
  {
    id: '2',
    title: 'Leilão de Cavalos Elite',
    description: 'Leilão de cavalos de alta qualidade',
    category: 'Leilão',
    eventStartDate: '2024-04-10',
    eventEndDate: '2024-04-12',
    location: {
      city: 'São Paulo',
      state: 'São Paulo',
      fullAddress: 'Centro de Eventos São Paulo'
    },
    publicationPlan: 'vip',
    status: 'active',
    createdAt: '2024-03-01',
    publishedAt: '2024-03-01',
    expiresAt: '2024-04-13',
    views: 189,
    featured: true,
    harasId: '1',
    harasName: 'Haras Vale Verde',
    canEdit: false, // Não pode editar porque foi impulsionado
    isBoosted: true,
    boostEndTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 horas no futuro
  },
  {
    id: '3',
    title: 'Exposição de Cavalos Crioulos',
    description: 'Exposição de cavalos da raça Crioula',
    category: 'Exposição',
    registrationStartDate: '2024-05-01',
    registrationEndDate: '2024-05-20',
    eventStartDate: '2024-06-01',
    eventStartTime: '09:00',
    eventEndDate: '2024-06-03',
    eventEndTime: '17:00',
    location: {
      city: 'Porto Alegre',
      state: 'Rio Grande do Sul',
      fullAddress: 'Parque de Exposições Assis Brasil'
    },
    publicationPlan: 'basic',
    status: 'draft',
    createdAt: '2024-04-15',
    views: 0,
    featured: false,
    harasId: '1',
    harasName: 'Haras Vale Verde',
    canEdit: true // Rascunho sempre pode editar
  },
  {
    id: '4',
    title: 'Competição de Três Tambores',
    description: 'Competição de três tambores com premiação',
    category: 'Competição',
    registrationStartDate: '2024-01-15',
    registrationEndDate: '2024-02-15',
    eventStartDate: '2024-02-20',
    eventStartTime: '08:00',
    eventEndDate: '2024-02-22',
    eventEndTime: '18:00',
    location: {
      city: 'Campinas',
      state: 'São Paulo',
      fullAddress: 'Centro Hípico de Campinas'
    },
    publicationPlan: 'premium',
    status: 'expired',
    createdAt: '2024-01-10',
    publishedAt: '2024-01-10',
    expiresAt: '2024-02-23',
    views: 156,
    featured: false,
    harasId: '1',
    harasName: 'Haras Vale Verde',
    canEdit: false // Expirado não pode editar
  }
];

export const eventCategories = [
  { id: 'Copa de Marcha', name: 'Copa de Marcha', icon: '' },
  { id: 'Competição', name: 'Competição', icon: '' },
  { id: 'Poeirão', name: 'Poeirão', icon: '' },
  { id: 'Leilão', name: 'Leilão', icon: '' },
  { id: 'Exposição', name: 'Exposição', icon: '' },
  { id: 'Curso Presencial', name: 'Curso Presencial', icon: '' },
  { id: 'Feira', name: 'Feira', icon: '' }
];

export const getFeaturedEvents = (): Event[] => {
  return mockEvents.filter(event => event.featured && event.status === 'active');
};

export const getEventsByCategory = (category: string): Event[] => {
  return mockEvents.filter(event => event.category === category && event.status === 'active');
};

export const searchEvents = (query: string): Event[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockEvents.filter(event => 
    event.title.toLowerCase().includes(lowercaseQuery) ||
    event.description.toLowerCase().includes(lowercaseQuery) ||
    event.location.city.toLowerCase().includes(lowercaseQuery)
  );
};

export const getUpcomingEvents = (): Event[] => {
  const today = new Date();
  return mockEvents.filter(event => {
    const eventDate = new Date(event.eventStartDate);
    return eventDate >= today && event.status === 'active';
  });
};

export const getUserEvents = (harasId: string): Event[] => {
  return mockEvents.filter(event => event.harasId === harasId);
};

export const getEventsByStatus = (status: 'active' | 'draft' | 'expired'): Event[] => {
  return mockEvents.filter(event => event.status === status);
};

export const canEditEvent = (event: Event): boolean => {
  if (event.status === 'draft') {
    return true; // Rascunhos sempre podem ser editados
  }
  
  if (event.status === 'expired') {
    return false; // Eventos expirados não podem ser editados
  }
  
  if (event.status === 'active' && event.publishedAt) {
    // Se o evento foi impulsionado, não pode mais editar
    if (event.isBoosted) {
      return false;
    }
    
    const publishedDate = new Date(event.publishedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= 24; // Pode editar apenas nas primeiras 24h (se não foi impulsionado)
  }
  
  return false;
};

export const canEditAnimal = (animal: Animal): boolean => {
  if (animal.adStatus === 'expired') {
    return false; // Animais expirados não podem ser editados
  }
  
  if (animal.adStatus === 'paused') {
    return true; // Animais pausados sempre podem ser editados
  }
  
  if (animal.adStatus === 'active') {
    // Se o animal foi impulsionado, não pode mais editar
    if (animal.isBoosted) {
      return false;
    }
    
    const publishedDate = new Date(animal.publishedDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= 24; // Pode editar apenas nas primeiras 24h (se não foi impulsionado)
  }
  
  return false;
};

// DEPRECATED: Use formatAgeShort from @/utils/dateUtils instead
// Mantida por compatibilidade, mas agora usa dateUtils internamente
export const getAge = (birthDate: string): string => {
  // Importar a função do dateUtils para garantir cálculo consistente
  // Nota: esta função retorna apenas anos para manter compatibilidade
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age = age - 1;
  }
  
  // Para animais com menos de 1 ano, mostrar em meses
  if (age === 0) {
    let months = monthDiff;
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    if (months < 0) {
      months += 12;
    }
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
};