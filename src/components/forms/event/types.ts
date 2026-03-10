// Tipos e constantes para formulário de eventos

export interface EventFormData {
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  // Datas de inscrição
  registrationStartDate: string;
  registrationEndDate: string;
  // Datas do evento
  eventStartDate: string;
  eventStartTime: string;
  eventEndDate: string;
  eventEndTime: string;
  location: {
    city: string;
    state: string;
    fullAddress: string;
  };
  registrationInfo: string;
  registrationLink: string;
  // Plano de publicação
  publicationPlan: string;
}

export const eventCategories = [
  { value: 'Copa de Marcha', label: 'Copa de Marcha', icon: '', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'Competição', label: 'Competição', icon: '', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'Poeirão', label: 'Poeirão', icon: '', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'Leilão', label: 'Leilão', icon: '', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'Exposição', label: 'Exposição', icon: '', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'Curso Presencial', label: 'Curso Presencial', icon: '', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'Feira', label: 'Feira', icon: '', color: 'bg-orange-100 text-orange-700 border-orange-200' }
];

export const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

export const publicationPlans = [
  {
    id: 'basic',
    name: 'Anúncio Básico',
    price: 89.90,
    description: 'Publicação padrão do evento',
    features: [
      'Evento publicado na plataforma',
      'Aparece nas buscas e filtros',
      'Sistema de expiração automática',
      'Suporte por email'
    ],
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: '📋'
  },
  {
    id: 'premium',
    name: 'Anúncio Premium',
    price: 149.90,
    description: 'Destaque seu evento com recursos premium',
    features: [
      'Tudo do plano Básico',
      'Destaque na página inicial',
      'Badge "Premium" no evento',
      'Prioridade nas buscas',
      'Suporte prioritário'
    ],
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '⭐',
    popular: true
  },
  {
    id: 'ultra',
    name: 'Anúncio Ultra',
    price: 249.90,
    description: 'Máxima visibilidade para seu evento',
    features: [
      'Tudo do plano Premium',
      'Posição fixa no topo da página',
      'Badge "Ultra" exclusivo',
      'Destaque em redes sociais',
      'Relatórios de performance',
      'Suporte VIP'
    ],
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: '👑'
  }
];

