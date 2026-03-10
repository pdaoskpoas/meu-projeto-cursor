// Funções utilitárias para os componentes de estatísticas do admin

export const getBoostSourceLabel = (source: string | null): string => {
  switch (source) {
    case 'admin': return 'Administrador';
    case 'plano_pro': return 'Pro (Gratuito)';
    case 'plano_ultra': return 'Ultra (Gratuito)';
    case 'plano_vip': return 'VIP (Gratuito)';
    case 'comprado': return 'Comprado';
    default: return 'N/A';
  }
};

export const getBoostSourceColor = (source: string | null): string => {
  switch (source) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'plano_pro': return 'bg-blue-100 text-blue-800';
    case 'plano_ultra': return 'bg-purple-100 text-purple-800';
    case 'plano_vip': return 'bg-yellow-100 text-yellow-800';
    case 'comprado': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ativo': return 'bg-green-100 text-green-800';
    case 'pausado': return 'bg-yellow-100 text-yellow-800';
    case 'inativo': return 'bg-gray-100 text-gray-800';
    case 'suspenso': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getNewsStatusColor = (status: string): string => {
  switch (status) {
    case 'publicado': return 'bg-green-100 text-green-800';
    case 'rascunho': return 'bg-yellow-100 text-yellow-800';
    case 'agendado': return 'bg-blue-100 text-blue-800';
    case 'arquivado': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getCategoryColor = (category: string): string => {
  const colors = [
    'bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800', 'bg-teal-100 text-teal-800'
  ];
  
  const hash = category.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const getBoostColor = (boostType: string | null): string => {
  switch (boostType) {
    case 'Pro': return 'bg-blue-100 text-blue-800';
    case 'Ultra': return 'bg-purple-100 text-purple-800';
    case 'VIP': return 'bg-yellow-100 text-yellow-800';
    case 'Free': return 'bg-gray-100 text-gray-800';
    case 'Admin': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR');
};

export const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? Math.round((value / total) * 100) : 0;
};

export const generatePagination = (currentPage: number, totalPages: number, maxVisible: number = 5) => {
  const pages: (number | string)[] = [];
  
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - halfVisible);
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
  }
  
  return pages;
};
