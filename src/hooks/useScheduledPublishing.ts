import { useEffect, useCallback } from 'react';
import { AdminArticle } from '@/hooks/admin/useAdminArticles';
import { checkScheduledArticles } from '@/utils/articleUtils';

export const useScheduledPublishing = (
  articles: AdminArticle[],
  setArticles: (articles: AdminArticle[]) => void
) => {
  const checkAndPublishScheduled = useCallback(() => {
    const updatedArticles = checkScheduledArticles(articles);
    
    // Verificar se houve mudanças
    const hasChanges = updatedArticles.some((article, index) => {
      const originalArticle = articles[index];
      return originalArticle && article.status !== originalArticle.status;
    });
    
    if (hasChanges) {
      setArticles(updatedArticles);
      
      // Mostrar notificação sobre artigos publicados
      const publishedArticles = updatedArticles.filter((article, index) => {
        const originalArticle = articles[index];
        return originalArticle && 
               originalArticle.status === 'scheduled' && 
               article.status === 'published';
      });
      
      if (publishedArticles.length > 0) {
        console.log(`${publishedArticles.length} artigo(s) foi(ram) publicado(s) automaticamente`);
        // Aqui você pode adicionar uma notificação toast se desejar
      }
    }
  }, [articles, setArticles]);

  useEffect(() => {
    // Verificar imediatamente ao montar o componente
    checkAndPublishScheduled();
    
    // Verificar a cada minuto
    const interval = setInterval(checkAndPublishScheduled, 60000);
    
    return () => clearInterval(interval);
  }, [checkAndPublishScheduled]);

  return {
    checkAndPublishScheduled
  };
};
