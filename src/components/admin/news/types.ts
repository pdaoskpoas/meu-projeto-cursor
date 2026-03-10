// Tipos para gerenciamento de notícias do admin

export interface NewsFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  coverImage: string;
  isHighlighted: boolean;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  tags: string[];
  scheduledPublishDate: string;
  publishNow: boolean;
  author: string;
}

export interface NewsFilters {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  authorFilter: string;
  highlightFilter: string;
  dateRangeFilter: string;
  sortBy: string;
}

export interface NewsStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  scheduledArticles: number;
  highlightedArticles: number;
  totalViews: number;
  totalClicks?: number;
  totalLikes: number;
  totalShares: number;
  averageViews: number;
  averageClicks?: number;
  averageLikes: number;
  averageShares: number;
}

export const newsCategories = [
  'Reprodução',
  'Nutrição',
  'Manejo',
  'Competições',
  'Veterinária',
  'Mercado',
  'Genética',
  'Treinamento',
  'Tecnologia',
  'Sustentabilidade'
];

export const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'archived', label: 'Arquivado' }
];

export const sortOptions = [
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'oldest', label: 'Mais Antigos' },
  { value: 'title', label: 'Título A-Z' },
  { value: 'views', label: 'Mais Visualizados' },
  { value: 'likes', label: 'Mais Curtidos' },
  { value: 'shares', label: 'Mais Compartilhados' }
];

