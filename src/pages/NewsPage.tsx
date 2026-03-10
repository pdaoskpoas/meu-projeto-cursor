import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Clock, Share2, Search, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { newsService, type Article } from '@/services/newsService';
import { analyticsService } from '@/services/analyticsService';
import { categories, popularTags } from '@/data/articlesData';
import heroHorse from '@/assets/hero-horse.jpg';

const fallbackImage = '/placeholder.svg';
const defaultImages = {
  'hero-horse': heroHorse,
};

const getImageSrc = (imageName: keyof typeof defaultImages) =>
  defaultImages[imageName] || fallbackImage;

// Componente para card pequeno de artigo popular com tracking
const PopularArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  // Registrar IMPRESSÃO quando o card aparece na tela
  useEffect(() => {
    if (!cardRef.current || hasBeenViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed) {
            analyticsService.recordImpression('article', article.id);
            setHasBeenViewed(true);
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px' }
    );

    const currentCard = cardRef.current;
    observer.observe(currentCard);
    return () => {
      observer.unobserve(currentCard);
    };
  }, [article.id, hasBeenViewed]);

  const handleCardClick = () => {
    analyticsService.recordClick('article', article.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Link
      ref={cardRef}
      to={`/noticias/${article.slug || article.id}`}
      onClick={handleCardClick}
      className="block group"
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={article.coverImageUrl || getImageSrc('hero-horse')}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h4>
          <div className="flex items-center text-xs text-slate-500">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(article.publishedAt || article.createdAt)}
          </div>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <User className="h-3 w-3 mr-1" />
            {article.authorName || 'Admin'}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Componente para card de artigo com tracking de impressão e clique
const ArticleCardWithTracking: React.FC<{ article: Article }> = ({ article }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  // Registrar IMPRESSÃO quando o card aparece na tela
  useEffect(() => {
    if (!cardRef.current || hasBeenViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed) {
            // 📊 Registrar IMPRESSÃO (visualização do card)
            analyticsService.recordImpression('article', article.id);
            setHasBeenViewed(true);
          }
        });
      },
      {
        threshold: 0.5, // 50% do card visível
        rootMargin: '0px'
      }
    );

    const currentCard = cardRef.current;
    observer.observe(currentCard);

    return () => {
      observer.unobserve(currentCard);
    };
  }, [article.id, hasBeenViewed]);

  // Registrar CLIQUE quando o usuário clica para ler
  const handleCardClick = () => {
    // 🖱️ Registrar CLIQUE (usuário clicou para ler)
    analyticsService.recordClick('article', article.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
      <Link to={`/noticias/${article.slug || article.id}`} onClick={handleCardClick} className="block">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={article.coverImageUrl || getImageSrc('hero-horse')}
              alt={article.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="absolute top-4 left-4">
            <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs font-semibold">
              {article.category || 'Geral'}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
          
          <p className="text-slate-600 text-sm mb-4 line-clamp-3">
            {article.excerpt || 'Leia o artigo completo...'}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {article.authorName || 'Admin'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(article.publishedAt || article.createdAt)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const NewsPage = () => {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('categoria') || 'Todas';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  
  // ✅ PRODUÇÃO: Buscar artigos do Supabase
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar artigos ao montar componente
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [articles, popular] = await Promise.all([
          newsService.getPublishedArticles(),
          newsService.getMostPopularArticles(5)
        ]);
        
        setAllArticles(articles);
        setPopularArticles(popular);
      } catch (err) {
        console.error('Erro ao buscar artigos:', err);
        setError('Não foi possível carregar as notícias. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);
  
  // Filter articles by selected category and search query
  const filteredArticles = useMemo(() => {
    let articles = allArticles;
    
    // Filter by category
    if (selectedCategory !== 'Todas') {
      articles = articles.filter(article => article.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (article.authorName && article.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Sort articles
    articles = [...articles].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
        case 'popular':
          return b.views - a.views;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      }
    });
    
    return articles;
  }, [allArticles, selectedCategory, searchQuery, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Estado de loading
  if (isLoading) {
    return (
      <main className="container-responsive section-spacing bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <span className="ml-3 text-xl text-gray-600">Carregando notícias...</span>
        </div>
      </main>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <main className="container-responsive section-spacing bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar notícias</h3>
          <p className="text-red-700">{error}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="container-responsive section-spacing bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>

        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            {selectedCategory === 'Todas' 
              ? 'Dicas e Notícias do Mundo Equestre' 
              : `Notícias de ${selectedCategory}`
            }
          </h1>
          <p className="text-slate-600 mb-4">
            Mantenha-se atualizado com as melhores dicas, notícias e tendências do mercado equestre brasileiro.
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Articles Column */}
          <div className="lg:col-span-2">
            {/* Articles Grid */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedCategory === 'Todas' ? 'Últimas Notícias' : `Notícias de ${selectedCategory}`}
                </h2>
                <div className="flex items-center text-slate-500 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Atualizado há poucos minutos
                </div>
              </div>

              {/* Se não houver artigos */}
              {filteredArticles.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-slate-500 text-lg">
                    Nenhuma notícia encontrada.
                    <br />
                    <span className="text-sm">Tente ajustar os filtros ou limpar a busca.</span>
                  </p>
                </Card>
              ) : (
                /* Cards Grid - Show all articles with tracking */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredArticles.map((article) => (
                    <ArticleCardWithTracking key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Buscar Notícias
              </h2>
              
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Título, autor ou conteúdo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Categoria</label>
                  <Select value={selectedCategory} onValueChange={(value) => {
                    if (value === 'Todas') {
                      window.location.href = '/noticias';
                    } else {
                      window.location.href = `/noticias?categoria=${value}`;
                    }
                  }}>
                    <SelectTrigger className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="Todas">Todas as categorias</SelectItem>
                      {categories.slice(1).map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                      <SelectValue placeholder="Selecione a ordenação" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="popular">Mais populares</SelectItem>
                      <SelectItem value="title">Título A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full h-9 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg font-medium transition-all duration-300"
                  onClick={() => {
                    setSearchQuery('');
                    setSortBy('recent');
                    window.location.href = '/noticias';
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {/* Popular Articles */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Mais Populares</h2>
              <div className="space-y-6">
                {popularArticles.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    Nenhum artigo popular ainda
                  </p>
                ) : (
                  popularArticles.map((article) => (
                    <PopularArticleCard key={article.id} article={article} />
                  ))
                )}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Newsletter</h2>
              <p className="text-slate-600 text-sm mb-6">
                Receba as principais notícias do mundo equestre diretamente no seu e-mail.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  Inscrever-se
                </Button>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
};

export default NewsPage;