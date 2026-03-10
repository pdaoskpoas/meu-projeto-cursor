// Mock data for articles and news

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  publishedDate: string;
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
}

// ✅ PRODUÇÃO: Array vazio - notícias virão do banco de dados real
export const mockArticles: Article[] = [];

export const categories = [
  'Todas',
  'Nutrição', 
  'Raças',
  'Reprodução',
  'Cuidados',
  'Eventos',
  'Manejo',
  'Saúde',
  'Competição'
];

export const popularTags = [
  'nutrição',
  'mangalarga',
  'reprodução',
  'cuidados',
  'saúde',
  'eventos',
  'raças',
  'alimentação'
];

export const getMostPopularArticles = (limit: number = 5): Article[] => {
  return mockArticles
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
};

export const getFeaturedArticles = (): Article[] => {
  return mockArticles.filter(article => article.featured);
};

export const getArticlesByCategory = (category: string): Article[] => {
  if (category === 'Todas') return mockArticles;
  return mockArticles.filter(article => article.category === category);
};

export const searchArticles = (query: string): Article[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockArticles.filter(article => 
    article.title.toLowerCase().includes(lowercaseQuery) ||
    article.excerpt.toLowerCase().includes(lowercaseQuery) ||
    article.content.toLowerCase().includes(lowercaseQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
