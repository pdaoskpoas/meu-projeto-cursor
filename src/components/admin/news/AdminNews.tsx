import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, List, Loader2, Eye, MousePointerClick, Edit, Trash2 } from 'lucide-react';
import { useAdminArticles } from '@/hooks/admin/useAdminArticles';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import NewsFilters from './NewsFilters';
import NewsStats from './NewsStats';
import { NewsFilters as NewsFiltersType, NewsStats as NewsStatsType } from './types';
import ArticleForm from './ArticleForm';
import NewsletterSubscriptions from './NewsletterSubscriptions';

const AdminNews: React.FC = () => {
  const navigate = useNavigate();
  const { articles, isLoading, error, refetch, deleteArticle } = useAdminArticles();
  const [activeTab, setActiveTab] = useState('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  const [filters, setFilters] = useState<NewsFiltersType>({
    searchTerm: '',
    statusFilter: 'all',
    categoryFilter: 'all',
    authorFilter: 'all',
    highlightFilter: 'all',
    dateRangeFilter: 'all',
    sortBy: 'newest'
  });

  // Filtrar e ordenar artigos
  const filteredArticles = useMemo(() => {
    const filtered = articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           article.content.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           (article.authorName && article.authorName.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
                           article.tags.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      // Convert status filter
      const articleStatus = article.isPublished ? 'published' : 'draft';
      const matchesStatus = filters.statusFilter === 'all' || articleStatus === filters.statusFilter;
      const matchesCategory = filters.categoryFilter === 'all' || article.category === filters.categoryFilter;
      const matchesAuthor = filters.authorFilter === 'all' || article.authorName === filters.authorFilter;
      const matchesHighlight = filters.highlightFilter === 'all' || 
                              (filters.highlightFilter === 'highlighted' && false) || // TODO: Add isHighlighted field
                              (filters.highlightFilter === 'not_highlighted' && true);

      let matchesDateRange = true;
      if (filters.dateRangeFilter !== 'all' && article.publishedAt) {
        const articleDate = new Date(article.publishedAt);
        const now = new Date();
        
        switch (filters.dateRangeFilter) {
          case 'today':
            matchesDateRange = articleDate.toDateString() === now.toDateString();
            break;
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDateRange = articleDate >= weekAgo;
            break;
          }
          case 'month': {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDateRange = articleDate >= monthAgo;
            break;
          }
          case 'year': {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDateRange = articleDate >= yearAgo;
            break;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesAuthor && matchesHighlight && matchesDateRange;
    });

    // Ordenar artigos
    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'shares':
          return (b.shares || 0) - (a.shares || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [articles, filters]);

  // Calcular estatísticas
  const stats = useMemo((): NewsStatsType => {
    const totalArticles = articles.length;
    const publishedArticles = articles.filter(a => a.isPublished).length;
    const draftArticles = articles.filter(a => !a.isPublished).length;
    const scheduledArticles = 0; // TODO: Add scheduled status
    const highlightedArticles = 0; // TODO: Add isHighlighted field
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalClicks = articles.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const totalLikes = articles.reduce((sum, a) => sum + (a.likes || 0), 0);
    const totalShares = articles.reduce((sum, a) => sum + (a.shares || 0), 0);

    return {
      totalArticles,
      publishedArticles,
      draftArticles,
      scheduledArticles,
      highlightedArticles,
      totalViews,
      totalClicks,
      totalLikes,
      totalShares,
      averageViews: totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
      averageClicks: totalArticles > 0 ? Math.round(totalClicks / totalArticles) : 0,
      averageLikes: totalArticles > 0 ? Math.round(totalLikes / totalArticles) : 0,
      averageShares: totalArticles > 0 ? Math.round(totalShares / totalArticles) : 0
    };
  }, [articles]);

  const handleCreateNew = () => {
    setEditingArticleId(undefined);
    setShowForm(true);
  };

  const handleEditArticle = (articleId: string) => {
    setEditingArticleId(articleId);
    setShowForm(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteArticle(articleId);
      toast({
        title: 'Sucesso',
        description: 'Artigo excluído com sucesso!',
      });
      refetch();
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir o artigo.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingArticleId(undefined);
    refetch();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingArticleId(undefined);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar artigos</h3>
          <p className="text-red-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando artigos...</span>
      </div>
    );
  }

  // Se estiver mostrando o formulário, renderizar apenas ele
  if (showForm) {
    return (
      <ArticleForm
        articleId={editingArticleId}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Notícias</h1>
          <p className="text-gray-600">Crie, edite e publique artigos para a plataforma</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Artigo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista de Artigos
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="flex items-center gap-2">
            Newsletter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filtros */}
          <NewsFilters
            filters={filters}
            setFilters={setFilters}
            articles={articles}
            showAdvanced={showAdvancedFilters}
            setShowAdvanced={setShowAdvancedFilters}
          />

          {/* Lista de Artigos */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Artigos ({filteredArticles.length})
                </h3>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum artigo encontrado com os filtros aplicados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {article.isPublished ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                    Publicado
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                    Rascunho
                                  </span>
                                )}
                                {article.category && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                    {article.category}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {article.title}
                              </h3>
                              {article.excerpt && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {article.excerpt}
                                </p>
                              )}
                            </div>
                            {article.coverImageUrl && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={article.coverImageUrl}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>Por:</span>
                              <span className="font-medium">{article.authorName || 'Admin'}</span>
                            </div>
                            {article.publishedAt && (
                              <div>
                                {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            {/* Contadores visíveis apenas para admins */}
                            {user?.role === 'admin' && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{article.views || 0} visualizações</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MousePointerClick className="h-4 w-4" />
                                  <span>{article.clicks || 0} cliques</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditArticle(article.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <NewsStats stats={stats} />
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gráficos e Relatórios</h3>
            <div className="text-center py-12">
              <p className="text-gray-500">
                Gráficos detalhados e relatórios serão implementados em breve.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-6">
          <NewsletterSubscriptions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNews;

