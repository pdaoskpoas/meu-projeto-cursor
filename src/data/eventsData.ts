// Mock data for events

export interface Event {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  image: string;
  location: {
    city: string;
    state: string;
    fullAddress?: string;
  };
  date: string;
  time: string;
  endDate?: string;
  category: string;
  organizer: string;
  registrationInfo?: string;
  registrationLink?: string;
  featured: boolean;
  images?: string[];
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Exposição Nacional de Mangalarga Marchador 2024',
    description: 'A maior exposição da raça Mangalarga Marchador do país, com competições de morfologia e andamentos.',
    fullDescription: `
      <h2>Sobre o Evento</h2>
      <p>A Exposição Nacional de Mangalarga Marchador 2024 é o maior evento da raça no país, reunindo os melhores exemplares para competições de morfologia e andamentos. O evento conta com a participação de criadores de todo o Brasil.</p>
      
      <h3>Programação</h3>
      <ul>
        <li><strong>Dia 15/03:</strong> Chegada dos animais e vistoria veterinária</li>
        <li><strong>Dia 16/03:</strong> Competições de potros e potrancas</li>
        <li><strong>Dia 17/03:</strong> Competições de éguas e garanhões</li>
        <li><strong>Dia 18/03:</strong> Finais e premiação</li>
      </ul>
      
      <h3>Categorias</h3>
      <ul>
        <li>Potros de 1 ano</li>
        <li>Potros de 2 anos</li>
        <li>Potrancas de 1 ano</li>
        <li>Potrancas de 2 anos</li>
        <li>Éguas de 3 a 5 anos</li>
        <li>Éguas acima de 6 anos</li>
        <li>Garanhões de 3 a 5 anos</li>
        <li>Garanhões acima de 6 anos</li>
      </ul>
      
      <h3>Premiação</h3>
      <p>Os vencedores receberão troféus, faixas e prêmios em dinheiro. O Grande Campeão receberá R$ 50.000 em prêmios.</p>
    `,
    image: 'mangalarga',
    location: {
      city: 'Belo Horizonte',
      state: 'MG',
      fullAddress: 'Expominas - Av. Amazonas, 6200 - Gameleira, Belo Horizonte - MG'
    },
    date: '2024-03-15',
    time: '08:00',
    endDate: '2024-03-18',
    category: 'Exposição',
    organizer: 'ABCCMM - Associação Brasileira dos Criadores do Cavalo Mangalarga Marchador',
    registrationInfo: 'Inscrições até 28/02/2024. Taxa: R$ 500 por animal.',
    registrationLink: 'https://abccmm.org.br/inscricoes',
    featured: true,
    images: ['mangalarga', 'hero-horse']
  },
  {
    id: '2',
    title: 'Copa de Marcha Diamantina 2024',
    description: 'Tradicional competição de marcha realizada em Diamantina, avaliando funcionalidade e comodidade.',
    fullDescription: `
      <h2>Copa de Marcha Diamantina</h2>
      <p>A Copa de Marcha Diamantina é uma das mais tradicionais competições de marcha do país, realizada na histórica cidade de Diamantina. O evento avalia exclusivamente a funcionalidade e comodidade dos andamentos.</p>
      
      <h3>Modalidades</h3>
      <ul>
        <li>Marcha Picada Feminina</li>
        <li>Marcha Picada Masculina</li>
        <li>Marcha Batida Feminina</li>
        <li>Marcha Batida Masculina</li>
        <li>Marcha Livre</li>
      </ul>
      
      <h3>Critérios de Julgamento</h3>
      <ul>
        <li>Comodidade do andamento</li>
        <li>Regularidade do ritmo</li>
        <li>Desenvolvimento da marcha</li>
        <li>Dissociação dos movimentos</li>
        <li>Postura e equilíbrio</li>
      </ul>
      
      <h3>Premiação Especial</h3>
      <p>Além dos troféus tradicionais, haverá prêmio especial de R$ 25.000 para o melhor conjunto (cavalo + cavaleiro) do evento.</p>
    `,
    image: 'hero-horse',
    location: {
      city: 'Diamantina',
      state: 'MG',
      fullAddress: 'Parque de Exposições de Diamantina - Rod. Diamantina-Curvelo, KM 2'
    },
    date: '2024-04-20',
    time: '14:00',
    endDate: '2024-04-21',
    category: 'Copa de Marcha',
    organizer: 'Prefeitura Municipal de Diamantina',
    registrationInfo: 'Inscrições até 10/04/2024. Taxa: R$ 300 por conjunto.',
    featured: true,
    images: ['hero-horse', 'mangalarga']
  },
  {
    id: '3',
    title: 'Competição de Três Tambores Fazenda São José',
    description: 'Emocionante competição de três tambores com premiação em dinheiro para todas as categorias.',
    fullDescription: `
      <h2>Competição de Três Tambores</h2>
      <p>A Fazenda São José promove uma das maiores competições de três tambores da região, com participação de amazonas de todo o estado e premiação em dinheiro.</p>
      
      <h3>Categorias</h3>
      <ul>
        <li>Mirim (até 12 anos)</li>
        <li>Infantil (13 a 17 anos)</li>
        <li>Juvenil (18 a 25 anos)</li>
        <li>Adulto (26 a 45 anos)</li>
        <li>Master (acima de 46 anos)</li>
        <li>Iniciante</li>
        <li>Profissional</li>
      </ul>
      
      <h3>Premiação</h3>
      <ul>
        <li>1º lugar: R$ 5.000 + troféu</li>
        <li>2º lugar: R$ 3.000 + troféu</li>
        <li>3º lugar: R$ 2.000 + troféu</li>
        <li>4º e 5º lugar: R$ 1.000 cada</li>
      </ul>
      
      <h3>Regulamento</h3>
      <p>A competição seguirá as regras da CBT (Confederação Brasileira de Tambor). Cada competidora terá direito a duas voltas, valendo o melhor tempo.</p>
    `,
    image: 'quarter-horse',
    location: {
      city: 'Ribeirão Preto',
      state: 'SP',
      fullAddress: 'Fazenda São José - Estrada Municipal, KM 15, Zona Rural'
    },
    date: '2024-05-10',
    time: '09:00',
    category: 'Competição',
    organizer: 'Fazenda São José',
    registrationInfo: 'Inscrições no local. Taxa: R$ 150 por categoria.',
    featured: false,
    images: ['quarter-horse']
  },
  {
    id: '4',
    title: 'Poeirão do Pantanal 2024',
    description: 'Tradicional evento de trabalho com gado e competições funcionais no coração do Pantanal.',
    fullDescription: `
      <h2>Poeirão do Pantanal</h2>
      <p>O Poeirão do Pantanal é um evento único que celebra a tradição pantaneira, com competições de trabalho com gado, apartação e outras modalidades funcionais.</p>
      
      <h3>Modalidades</h3>
      <ul>
        <li>Apartação Individual</li>
        <li>Apartação em Dupla</li>
        <li>Mangueira</li>
        <li>Laço Comprido</li>
        <li>Tambor</li>
        <li>Baliza</li>
      </ul>
      
      <h3>Programação Cultural</h3>
      <ul>
        <li>Shows com artistas regionais</li>
        <li>Comidas típicas pantaneiras</li>
        <li>Exposição de artesanato local</li>
        <li>Apresentações folclóricas</li>
      </ul>
      
      <h3>Hospedagem</h3>
      <p>A fazenda oferece hospedagem em apartamentos rústicos para os participantes. Reservas antecipadas necessárias.</p>
    `,
    image: 'hero-horse',
    location: {
      city: 'Corumbá',
      state: 'MS',
      fullAddress: 'Fazenda Pantanal - Estrada do Pantanal, KM 45'
    },
    date: '2024-06-15',
    time: '07:00',
    endDate: '2024-06-16',
    category: 'Poeirão',
    organizer: 'Fazenda Pantanal',
    registrationInfo: 'Inscrições até 01/06/2024. Taxa: R$ 400 (inclui hospedagem e alimentação).',
    featured: true,
    images: ['hero-horse', 'quarter-horse']
  },
  {
    id: '5',
    title: 'Exposição de Thoroughbred - Derby Paulista',
    description: 'Exposição e competições da raça Thoroughbred com foco em animais de corrida.',
    fullDescription: `
      <h2>Derby Paulista de Thoroughbred</h2>
      <p>O Derby Paulista é o principal evento da raça Thoroughbred no estado, reunindo os melhores exemplares para competições de morfologia e provas funcionais.</p>
      
      <h3>Provas Funcionais</h3>
      <ul>
        <li>Páreo de 1000m para potros de 2 anos</li>
        <li>Páreo de 1600m para animais de 3 anos</li>
        <li>Grande Prêmio de 2000m</li>
        <li>Prova de resistência de 3000m</li>
      </ul>
      
      <h3>Julgamento Morfológico</h3>
      <ul>
        <li>Cabeça e pescoço</li>
        <li>Linha superior</li>
        <li>Membros anteriores</li>
        <li>Membros posteriores</li>
        <li>Impressão geral</li>
      </ul>
      
      <h3>Premiação</h3>
      <p>Total de R$ 100.000 em prêmios distribuídos entre todas as modalidades. O Grande Campeão receberá troféu especial e R$ 30.000.</p>
    `,
    image: 'thoroughbred',
    location: {
      city: 'São Paulo',
      state: 'SP',
      fullAddress: 'Jockey Club de São Paulo - Rua Lineu de Paula Machado, 1263'
    },
    date: '2024-07-20',
    time: '15:00',
    endDate: '2024-07-21',
    category: 'Exposição',
    organizer: 'Jockey Club de São Paulo',
    registrationInfo: 'Inscrições até 05/07/2024. Taxa varia por categoria.',
    registrationLink: 'https://jockeysp.com.br/derby',
    featured: false,
    images: ['thoroughbred']
  }
];

export const eventCategories = [
  'Todas',
  'Exposição',
  'Copa de Marcha',
  'Competição',
  'Poeirão',
  'Leilão',
  'Curso',
  'Feira'
];

export const getFeaturedEvents = (): Event[] => {
  return mockEvents.filter(event => event.featured);
};

export const getEventsByCategory = (category: string): Event[] => {
  if (category === 'Todas') return mockEvents;
  return mockEvents.filter(event => event.category === category);
};

export const searchEvents = (query: string): Event[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockEvents.filter(event => 
    event.title.toLowerCase().includes(lowercaseQuery) ||
    event.description.toLowerCase().includes(lowercaseQuery) ||
    event.location.city.toLowerCase().includes(lowercaseQuery) ||
    event.location.state.toLowerCase().includes(lowercaseQuery) ||
    event.category.toLowerCase().includes(lowercaseQuery)
  );
};

export const getUpcomingEvents = (limit: number = 3): Event[] => {
  const now = new Date();
  return mockEvents
    .filter(event => new Date(event.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
};