// Funções utilitárias para gerenciamento de haras

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'suspended': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'inactive': return 'Inativo';
    case 'suspended': return 'Suspenso';
    default: return 'Desconhecido';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'active': return 'CheckCircle';
    case 'inactive': return 'XCircle';
    case 'suspended': return 'AlertTriangle';
    default: return 'XCircle';
  }
};

export const getPlanColor = (plan: string): string => {
  switch (plan) {
    case 'Free': return 'bg-gray-100 text-gray-800';
    case 'Pro': return 'bg-blue-100 text-blue-800';
    case 'Ultra': return 'bg-purple-100 text-purple-800';
    case 'VIP': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'haras': return 'bg-green-100 text-green-800';
    case 'fazenda': return 'bg-blue-100 text-blue-800';
    case 'cte': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'haras': return 'Haras';
    case 'fazenda': return 'Fazenda';
    case 'cte': return 'Centro de Treinamento';
    default: return 'Desconhecido';
  }
};

export const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'haras': return 'Building';
    case 'fazenda': return 'Map';
    case 'cte': return 'Users';
    default: return 'Building';
  }
};

export const getPlanIcon = (plan: string): string => {
  switch (plan) {
    case 'Free': return 'Users';
    case 'Pro': return 'Star';
    case 'Ultra': return 'Zap';
    case 'VIP': return 'Crown';
    default: return 'Users';
  }
};

export const getPlanStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const generateMockCoordinates = (city: string, state: string) => {
  // Coordenadas aproximadas dos centros das capitais brasileiras
  const stateCoordinates: Record<string, { lat: number; lng: number }> = {
    'São Paulo': { lat: -23.5505, lng: -46.6333 },
    'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
    'Minas Gerais': { lat: -19.9167, lng: -43.9345 },
    'Paraná': { lat: -25.4244, lng: -49.2654 },
    'Santa Catarina': { lat: -27.5954, lng: -48.5480 },
    'Rio Grande do Sul': { lat: -30.0346, lng: -51.2177 },
    'Bahia': { lat: -12.9714, lng: -38.5014 },
    'Goiás': { lat: -16.6864, lng: -49.2643 },
    'Pernambuco': { lat: -8.0476, lng: -34.8770 },
    'Ceará': { lat: -3.7319, lng: -38.5267 }
  };

  const baseCoords = stateCoordinates[state] || { lat: -15.7942, lng: -47.8822 }; // Brasília como fallback
  
  // Adicionar pequena variação aleatória para simular diferentes cidades
  const variation = 0.5; // ~55km de variação
  const latVariation = (Math.random() - 0.5) * variation;
  const lngVariation = (Math.random() - 0.5) * variation;
  
  return {
    lat: baseCoords.lat + latVariation,
    lng: baseCoords.lng + lngVariation
  };
};

