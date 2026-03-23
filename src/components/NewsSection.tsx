import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseContentStats } from '@/hooks/useSupabaseContentStats';
import { analyticsService } from '@/services/analyticsService';
import { newsService, type Article } from '@/services/newsService';
import { newsletterService } from '@/services/newsletterService';

// Componente para cada artigo individual
const ArticleCard = ({ article }: { article: Article }) => {
  // 🔒 Hook seguro: busca views do Supabase
  const { impressions: views } = useSupabaseContentStats('article', article.id);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [hasBeenViewed, setHasBeenViewed] = React.useState(false);

  // Registrar impressão quando o card aparece na tela
  React.useEffect(() => {
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Reprodução': 'bg-pink-500',
      'Nutrição': 'bg-green-500',
      'Manejo': 'bg-blue-500',
      'Competições': 'bg-purple-500',
      'Veterinária': 'bg-red-500',
      'Mercado': 'bg-yellow-500',
      'Genética': 'bg-indigo-500',
      'Treinamento': 'bg-orange-500',
      'Tecnologia': 'bg-cyan-500',
      'Sustentabilidade': 'bg-emerald-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const handleCardClick = () => {
    // 🖱️ Registrar CLIQUE (usuário clicou para ler)
    analyticsService.recordClick('article', article.id);
  };



  return (
    <Card ref={cardRef} className="bg-white border-0 shadow-lg hover:shadow-2xl group cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col h-[480px]">
      <Link to={`/noticias/${article.slug || article.id}`} onClick={handleCardClick} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative overflow-hidden flex-shrink-0">
          <img
            src={article.coverImageUrl || 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=250&fit=crop'}
            alt={article.title}
            width={400}
            height={192}
            loading="lazy"
            decoding="async"
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex flex-col flex-grow">
          {/* Category */}
          {article.category && (
            <div className="flex items-center space-x-2">
              <div className={`w-1 h-6 ${getCategoryColor(article.category)} rounded-full`}></div>
              <span className="text-sm font-semibold text-slate-600">{article.category}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>

          {/* Author and Date */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-slate-500" />
              </div>
              <span className="text-xs font-medium text-slate-600">
                por Vitrine do Cavalo
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>{getTimeAgo(article.publishedAt)}</span>
            </div>
          </div>

        </div>
      </Link>
    </Card>
  );
};

const NewsSection = () => {
  // ✅ Buscar notícias reais do Supabase
  const [newsArticles, setNewsArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        // Buscar as últimas 3 notícias publicadas
        const articles = await newsService.getPublishedArticles({ limit: 3 });
        setNewsArticles(articles);
      } catch (error) {
        console.error('Erro ao buscar notícias:', error);
        setNewsArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    return `${Math.floor(diffInDays / 7)} semanas atrás`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Mercado Equestre': return 'bg-blue-500';
      case 'Tecnologia': return 'bg-purple-500';
      case 'Competições': return 'bg-emerald-500';
      case 'Sustentabilidade': return 'bg-green-500';
      case 'Recordes': return 'bg-orange-500';
      case 'Exportação': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <section className="bg-white py-20">
      <div className="container-responsive">
        {/* Header */}
        <div className="text-center space-content mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 text-balance">
            Últimas notícias da
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"> Vitrine</span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mt-4">
            Acompanhe novidades, historias, eventos, tendencias e temas relevantes para a comunidade.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
          </div>
        )}

        {/* News Grid - Últimas 3 notícias */}
        {!isLoading && newsArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 auto-rows-fr">
            {newsArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && newsArticles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-slate-600">
              Nenhuma notícia disponível no momento.
            </p>
          </div>
        )}

        {/* Professional CTA */}
        <div className="text-center">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Mantenha-se Atualizado com Nossos Conteudos
              </h3>
              <p className="text-slate-600 text-lg mb-6">
                Receba novidades e publicacoes diretamente no seu e-mail.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/noticias">
                  <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    Ver Todas as Notícias
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  type="button"
                  onClick={() => setNewsletterOpen((prev) => !prev)}
                  variant="outline"
                  className="border-2 border-slate-300 hover:border-red-500 hover:text-red-600 px-8 py-4 text-lg font-bold transition-all duration-300"
                >
                  Assinar Newsletter
                </Button>
              </div>

              {newsletterOpen && (
                <form
                  className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (newsletterLoading) return;
                    setNewsletterLoading(true);
                    const result = await newsletterService.subscribe(newsletterEmail, 'news_section_cta');
                    setNewsletterLoading(false);

                    toast({
                      title: result.success ? 'Newsletter' : 'Nao foi possivel assinar',
                      description: result.message,
                      variant: result.success ? 'default' : 'destructive',
                    });

                    if (result.success) {
                      setNewsletterEmail('');
                      setNewsletterOpen(false);
                    }
                  }}
                >
                  <Input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="sm:max-w-sm bg-white"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={newsletterLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {newsletterLoading ? 'Enviando...' : 'Cadastrar e-mail'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
