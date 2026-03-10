import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { NewsFilters as NewsFiltersType, newsCategories, statusOptions, sortOptions } from './types';
import { AdminArticle } from '@/hooks/admin/useAdminArticles';

interface NewsFiltersProps {
  filters: NewsFiltersType;
  setFilters: (filters: NewsFiltersType) => void;
  articles: AdminArticle[];
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

const NewsFilters: React.FC<NewsFiltersProps> = ({
  filters,
  setFilters,
  articles,
  showAdvanced,
  setShowAdvanced
}) => {
  const updateFilter = (key: keyof NewsFiltersType, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      authorFilter: 'all',
      highlightFilter: 'all',
      dateRangeFilter: 'all',
      sortBy: 'newest'
    });
  };

  const uniqueAuthors = Array.from(new Set(articles.map(article => article.authorName).filter(Boolean)));

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* Linha Principal de Filtros */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Busca */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por título, conteúdo, autor ou tags..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status */}
          <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botão Filtros Avançados */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </Button>

          {/* Limpar Filtros */}
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        </div>

        {/* Filtros Avançados */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Categoria */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Categoria
              </label>
              <Select value={filters.categoryFilter} onValueChange={(value) => updateFilter('categoryFilter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {newsCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Autor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Autor
              </label>
              <Select value={filters.authorFilter} onValueChange={(value) => updateFilter('authorFilter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os autores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os autores</SelectItem>
                  {uniqueAuthors.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destaque */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Destaque
              </label>
              <Select value={filters.highlightFilter} onValueChange={(value) => updateFilter('highlightFilter', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="highlighted">Em destaque</SelectItem>
                  <SelectItem value="not_highlighted">Sem destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Período
              </label>
              <Select value={filters.dateRangeFilter} onValueChange={(value) => updateFilter('dateRangeFilter', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NewsFilters;

