import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, TrendingUp, Eye, Heart, Clock, Tag, Loader2, Facebook, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { newsService, type Article } from '@/services/newsService';
import { useSupabaseContentStats } from '@/hooks/useSupabaseContentStats';
import { analyticsService } from '@/services/analyticsService';
import { sanitizeRichText } from '@/utils/sanitize';
import { useAuth } from '@/contexts/AuthContext';
import ArticleSEO from '@/components/ArticleSEO';
import { AdSenseScript } from '@/components/adsense/AdSenseScript';
import { AdSenseBanner } from '@/components/adsense/AdSenseBanner';
import { useAdSenseConfig } from '@/hooks/useAdSenseConfig';

// Helper para verificar se é UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Verificar se é administrador
  const isAdmin = user?.role === 'admin';
  
  // ✅ PRODUÇÃO: Buscar artigo do Supabase
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔒 Hook seguro: busca stats do Supabase (usa ID após carregar) - APENAS para admins
  const { impressions: views, clicks, isLoading } = useSupabaseContentStats('article', article?.id || '');
  
  // Estados para interações (likes/shares podem ser localStorage locais)
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  // ✅ Buscar configuração do AdSense
  const { config: adsenseConfig } = useAdSenseConfig();

  // Buscar artigo ao montar componente
  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      try {
        setIsLoadingArticle(true);
        setError(null);
        
        let articleData: Article | null = null;
        
        // Verificar se o slug é um UUID (link antigo)
        if (isUUID(slug)) {
          // Buscar artigo por ID
          articleData = await newsService.getArticleById(slug);
          
          // Se encontrado e tem slug, redirecionar para URL correta
          if (articleData && articleData.slug) {
            navigate(`/noticias/${articleData.slug}`, { replace: true });
            return; // O useEffect será chamado novamente com o novo slug
          }
        } else {
          // Buscar artigo por slug (comportamento normal)
          articleData = await newsService.getArticleBySlug(slug);
        }
        
        // Buscar artigos populares
        const popularArticles = await newsService.getMostPopularArticles(4);
        
        if (!articleData) {
          setError('Artigo não encontrado');
          return;
        }
        
        setArticle(articleData);
        setRelatedArticles(popularArticles.filter(a => a.id !== articleData.id).slice(0, 3));
        
        // ❌ NÃO incrementar views aqui - views são contadas na listagem de notícias
        // O clique já foi registrado quando o usuário clicou no card
        
      } catch (err) {
        console.error('Erro ao buscar artigo:', err);
        setError('Não foi possível carregar o artigo. Tente novamente mais tarde.');
      } finally {
        setIsLoadingArticle(false);
      }
    };

    fetchArticle();
  }, [slug, navigate]);

  // 🔒 Registrar impressão quando carregar (via Supabase)
  useEffect(() => {
    if (article && article.id) {
      analyticsService.recordImpression('article', article.id);
    }
  }, [article]);

  // Estado de loading
  if (isLoadingArticle) {
    return (
      <main className="container-responsive section-spacing min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <span className="ml-3 text-xl text-gray-600">Carregando artigo...</span>
        </div>
      </main>
    );
  }

  // Estado de erro ou não encontrado
  if (error || !article) {
    return (
      <main className="container-responsive section-spacing min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-semibold text-slate-900">Artigo não encontrado</h1>
            <p className="text-slate-600">{error || 'O artigo solicitado não foi encontrado em nossa base de dados.'}</p>
            <Link to="/noticias">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                Voltar para Notícias
              </Button>
            </Link>
          </div>
      </main>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleLikeClick = () => {
    setHasLiked(!hasLiked);
    setLikes(hasLiked ? likes - 1 : likes + 1);
    
    // 🔒 Registrar clique no Supabase
    if (article?.id) {
      analyticsService.recordClick('article', article.id, undefined, { clickTarget: 'like' });
    }
  };

  const handleShareClick = () => {
    setShares(shares + 1);
    setHasShared(true);
    
    // 🔒 Registrar clique no Supabase
    if (article?.id) {
      analyticsService.recordClick('article', article.id, undefined, { clickTarget: 'share' });
    }
    
    // Compartilhar nas redes sociais
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href
      });
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(window.location.href);
    }
  };


  // Função para dividir o conteúdo em partes para inserir anúncios
  const splitContentForAds = (content: string) => {
    if (!adsenseConfig?.is_active || !adsenseConfig?.article_mid_banner) {
      return { top: content, mid: null, bottom: null };
    }

    // Dividir por parágrafos (preservando tags de fechamento)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    
    if (paragraphs.length < 3) {
      return { top: content, mid: null, bottom: null };
    }

    // Calcular pontos de divisão (40% top, 30% mid, 30% bottom)
    const topEnd = Math.max(1, Math.floor(paragraphs.length * 0.4));
    const midEnd = Math.max(topEnd + 1, Math.floor(paragraphs.length * 0.7));

    // Reconstruir HTML das partes
    const topElements = paragraphs.slice(0, topEnd);
    const midElements = paragraphs.slice(topEnd, midEnd);
    const bottomElements = paragraphs.slice(midEnd);

    const topContent = topElements.map(p => p.outerHTML).join('');
    const midContent = midElements.map(p => p.outerHTML).join('');
    const bottomContent = bottomElements.map(p => p.outerHTML).join('');

    return { top: topContent, mid: midContent, bottom: bottomContent };
  };

  const contentParts = article ? splitContentForAds(article.content) : { top: '', mid: null, bottom: null };

  return (
    <main className="min-h-screen bg-white">
        {/* AdSense Script Global - Carregado apenas uma vez */}
        {adsenseConfig?.global_script && (
          <AdSenseScript script={adsenseConfig.global_script} />
        )}

        {/* SEO Meta Tags */}
        {/* <ArticleSEO
          title={article.title}
          description={article.excerpt}
          image={article.coverImageUrl}
          author={article.authorName}
          publishedAt={article.publishedAt}
          category={article.category}
          tags={article.tags}
        /> */}
        
        {/* Header com navegação */}
        <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/noticias" className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Notícias</span>
            </Link>
          </div>
        </div>

        {/* Article Container - Layout profissional estilo sites de notícias */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Badge */}
          <div className="mb-6">
            <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-0 text-sm font-semibold px-3 py-1">
              {article.category || 'Geral'}
            </Badge>
          </div>

          {/* Title - Estilo G1 */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* Excerpt - Subtítulo */}
          {article.excerpt && (
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 font-normal max-w-3xl">
              {article.excerpt}
            </p>
          )}

          {/* Author & Date & Reading Time */}
          <div className="flex items-center justify-between pb-10 mb-12 border-b border-slate-200">
            <div className="flex items-center space-x-4">
              {/* Author Avatar */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(article.authorName || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{article.authorName || 'Admin'}</p>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <time dateTime={article.publishedAt || article.createdAt}>
                      {formatDate(article.publishedAt || article.createdAt)}
                    </time>
                    <span>·</span>
                    <span>{Math.ceil((article.content?.length || 0) / 1000) || 5} min de leitura</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin-only Stats */}
            {isAdmin && (
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{views.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">{clicks} cliques</span>
                </div>
              </div>
            )}
          </div>

          {/* Hero Image - Full width dentro do container */}
          {article.coverImageUrl && (
            <figure className="mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
                <img
                  src={article.coverImageUrl}
                  alt={article.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                />
              </div>
            </figure>
          )}

          {/* Banner AdSense no início do conteúdo */}
          {adsenseConfig?.is_active && adsenseConfig?.article_top_banner && (
            <div className="mb-8">
              <AdSenseBanner 
                code={adsenseConfig.article_top_banner}
                className="w-full"
              />
            </div>
          )}

          {/* Article Content - Typography exatamente como G1 */}
          <div className="mb-16">
            {/* Se houver divisão de conteúdo (para anúncios), renderizar em partes */}
            {contentParts.mid ? (
              <>
                {/* Parte superior do conteúdo */}
                {contentParts.top && (
                  <div 
                    className="prose prose-sm max-w-none 
                      prose-slate 
                      prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-900 
                      prose-h2:text-xl sm:text-2xl prose-h2:mt-16 prose-h2:mb-4 prose-h2:leading-tight prose-h2:font-bold
                      prose-h3:text-lg sm:text-xl prose-h3:mt-12 prose-h3:mb-3 prose-h3:leading-tight prose-h3:font-bold
                      prose-p:text-slate-900 prose-p:leading-[1.65] prose-p:mb-5 prose-p:text-[16px] prose-p:font-normal
                      prose-p:first-of-type:text-[16px] prose-p:first-of-type:leading-[1.65] prose-p:first-of-type:font-normal prose-p:first-of-type:text-slate-900 prose-p:first-of-type:mb-5
                      prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-all
                      prose-strong:text-slate-900 prose-strong:font-semibold
                      prose-ul:my-5 prose-ul:space-y-2 prose-li:text-slate-900 prose-li:leading-[1.65] prose-li:pl-2 prose-li:text-[16px]
                      prose-ol:my-5 prose-ol:space-y-2 prose-ol:li:text-slate-900 prose-ol:li:leading-[1.65] prose-ol:li:pl-2 prose-ol:li:text-[16px]
                      prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-5 prose-blockquote:italic prose-blockquote:text-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:text-[16px] prose-blockquote:leading-[1.65]
                      prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:w-full
                      prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      [&>p+p]:mt-5 [&>h2+p]:mt-4 [&>h3+p]:mt-3"
                    style={{ fontSize: '16px', lineHeight: '1.65' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(contentParts.top) }}
                  />
                )}

                {/* Banner AdSense no meio do conteúdo */}
                {adsenseConfig?.is_active && adsenseConfig?.article_mid_banner && (
                  <div className="my-8">
                    <AdSenseBanner 
                      code={adsenseConfig.article_mid_banner}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Parte do meio do conteúdo */}
                {contentParts.mid && (
                  <div 
                    className="prose prose-sm max-w-none 
                      prose-slate 
                      prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-900 
                      prose-h2:text-xl sm:text-2xl prose-h2:mt-16 prose-h2:mb-4 prose-h2:leading-tight prose-h2:font-bold
                      prose-h3:text-lg sm:text-xl prose-h3:mt-12 prose-h3:mb-3 prose-h3:leading-tight prose-h3:font-bold
                      prose-p:text-slate-900 prose-p:leading-[1.65] prose-p:mb-5 prose-p:text-[16px] prose-p:font-normal
                      prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-all
                      prose-strong:text-slate-900 prose-strong:font-semibold
                      prose-ul:my-5 prose-ul:space-y-2 prose-li:text-slate-900 prose-li:leading-[1.65] prose-li:pl-2 prose-li:text-[16px]
                      prose-ol:my-5 prose-ol:space-y-2 prose-ol:li:text-slate-900 prose-ol:li:leading-[1.65] prose-ol:li:pl-2 prose-ol:li:text-[16px]
                      prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-5 prose-blockquote:italic prose-blockquote:text-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:text-[16px] prose-blockquote:leading-[1.65]
                      prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:w-full
                      prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      [&>p+p]:mt-5 [&>h2+p]:mt-4 [&>h3+p]:mt-3"
                    style={{ fontSize: '16px', lineHeight: '1.65' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(contentParts.mid) }}
                  />
                )}

                {/* Parte inferior do conteúdo */}
                {contentParts.bottom && (
                  <div 
                    className="prose prose-sm max-w-none 
                      prose-slate 
                      prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-900 
                      prose-h2:text-xl sm:text-2xl prose-h2:mt-16 prose-h2:mb-4 prose-h2:leading-tight prose-h2:font-bold
                      prose-h3:text-lg sm:text-xl prose-h3:mt-12 prose-h3:mb-3 prose-h3:leading-tight prose-h3:font-bold
                      prose-p:text-slate-900 prose-p:leading-[1.65] prose-p:mb-5 prose-p:text-[16px] prose-p:font-normal
                      prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-all
                      prose-strong:text-slate-900 prose-strong:font-semibold
                      prose-ul:my-5 prose-ul:space-y-2 prose-li:text-slate-900 prose-li:leading-[1.65] prose-li:pl-2 prose-li:text-[16px]
                      prose-ol:my-5 prose-ol:space-y-2 prose-ol:li:text-slate-900 prose-ol:li:leading-[1.65] prose-ol:li:pl-2 prose-ol:li:text-[16px]
                      prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-5 prose-blockquote:italic prose-blockquote:text-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:text-[16px] prose-blockquote:leading-[1.65]
                      prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:w-full
                      prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      [&>p+p]:mt-5 [&>h2+p]:mt-4 [&>h3+p]:mt-3"
                    style={{ fontSize: '16px', lineHeight: '1.65' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(contentParts.bottom) }}
                  />
                )}
              </>
            ) : (
              /* Se não houver divisão, mostrar conteúdo completo */
              <div 
                className="prose prose-sm max-w-none 
                  prose-slate 
                  prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-900 
                  prose-h2:text-xl sm:text-2xl prose-h2:mt-16 prose-h2:mb-4 prose-h2:leading-tight prose-h2:font-bold
                  prose-h3:text-lg sm:text-xl prose-h3:mt-12 prose-h3:mb-3 prose-h3:leading-tight prose-h3:font-bold
                  prose-p:text-slate-900 prose-p:leading-[1.65] prose-p:mb-5 prose-p:text-[16px] prose-p:font-normal
                  prose-p:first-of-type:text-[16px] prose-p:first-of-type:leading-[1.65] prose-p:first-of-type:font-normal prose-p:first-of-type:text-slate-900 prose-p:first-of-type:mb-5
                  prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-all
                  prose-strong:text-slate-900 prose-strong:font-semibold
                  prose-ul:my-5 prose-ul:space-y-2 prose-li:text-slate-900 prose-li:leading-[1.65] prose-li:pl-2 prose-li:text-[16px]
                  prose-ol:my-5 prose-ol:space-y-2 prose-ol:li:text-slate-900 prose-ol:li:leading-[1.65] prose-ol:li:pl-2 prose-ol:li:text-[16px]
                  prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-5 prose-blockquote:italic prose-blockquote:text-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:text-[16px] prose-blockquote:leading-[1.65]
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:w-full
                  prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  [&>p+p]:mt-5 [&>h2+p]:mt-4 [&>h3+p]:mt-3"
                style={{ fontSize: '16px', lineHeight: '1.65' }}
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(article.content) }}
              />
            )}
          </div>

          {/* Banner AdSense no final do conteúdo */}
          {adsenseConfig?.is_active && adsenseConfig?.article_bottom_banner && (
            <div className="mb-8">
              <AdSenseBanner 
                code={adsenseConfig.article_bottom_banner}
                className="w-full"
              />
            </div>
          )}

          {/* Tags Section */}
          {article.tags && article.tags.length > 0 && (
            <div className="py-8 border-y border-slate-200 mb-12">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-5 w-5 text-slate-400" />
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/noticias?tag=${tag}`}
                    className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Share Buttons - Profissional */}
          <div className="py-8 border-b border-slate-200 mb-12">
            <p className="text-sm font-semibold text-slate-900 mb-4">Compartilhe este artigo</p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShareClick}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Facebook className="h-4 w-4" />
                <span>Facebook</span>
              </button>
              <button
                onClick={handleShareClick}
                className="flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Twitter className="h-4 w-4" />
                <span>Twitter</span>
              </button>
              <button
                onClick={handleShareClick}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </button>
              <button
                onClick={handleShareClick}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium text-sm"
              >
                <LinkIcon className="h-4 w-4" />
                <span>Copiar link</span>
              </button>
            </div>
          </div>
        </article>

        {/* Related Articles - Largura completa mas com container */}
        <section className="bg-slate-50 py-16 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8">Artigos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.slice(0, 3).map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  to={`/noticias/${relatedArticle.slug || relatedArticle.id}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {relatedArticle.coverImageUrl && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={relatedArticle.coverImageUrl}
                        alt={relatedArticle.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <Badge className="bg-orange-50 text-orange-700 border-0 text-xs font-semibold mb-3">
                      {relatedArticle.category || 'Geral'}
                    </Badge>
                    <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-3">
                      {relatedArticle.title}
                    </h3>
                    {relatedArticle.excerpt && (
                      <p className="text-slate-600 line-clamp-2 mb-4 text-sm">
                        {relatedArticle.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      <time>{formatDate(relatedArticle.publishedAt || relatedArticle.createdAt)}</time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="bg-gradient-to-br from-orange-50 via-white to-red-50 py-16 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
              Não perca nenhuma notícia
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Receba as principais notícias e análises do mundo equestre diretamente no seu e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-base"
              />
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                Assinar
              </Button>
            </div>
          </div>
        </section>
    </main>
  );
};

export default ArticlePage;