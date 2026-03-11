/**
 * News Scheduler Service
 * 
 * Este serviço é responsável por publicar automaticamente artigos agendados
 * quando o horário de publicação é atingido.
 */

import { supabase } from '@/lib/supabase';

class NewsSchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Verifica a cada 1 minuto

  /**
   * Inicia o scheduler que verifica periodicamente por artigos a serem publicados
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Scheduler já está em execução');
      return;
    }

    console.log('News Scheduler: Iniciando verificação periódica de artigos agendados...');
    
    // Executar imediatamente na primeira vez
    this.checkAndPublishScheduledArticles();

    // Depois executar a cada intervalo definido
    this.intervalId = setInterval(() => {
      this.checkAndPublishScheduledArticles();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Para o scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('News Scheduler: Parado');
    }
  }

  /**
   * Verifica e publica artigos agendados cujo horário já passou
   */
  private async checkAndPublishScheduledArticles(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Buscar artigos que devem ser publicados
      const { data: articlesToPublish, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, scheduled_publish_at')
        .eq('is_published', false)
        .not('scheduled_publish_at', 'is', null)
        .lte('scheduled_publish_at', now);

      if (fetchError) {
        console.error('News Scheduler: Erro ao buscar artigos agendados:', fetchError);
        return;
      }

      if (!articlesToPublish || articlesToPublish.length === 0) {
        return; // Nenhum artigo para publicar
      }

      console.log(`News Scheduler: ${articlesToPublish.length} artigo(s) pronto(s) para publicação`);

      // Publicar cada artigo
      for (const article of articlesToPublish) {
        await this.publishArticle(article.id, article.title);
      }
    } catch (error) {
      console.error('News Scheduler: Erro ao verificar artigos agendados:', error);
    }
  }

  /**
   * Publica um artigo específico
   */
  private async publishArticle(articleId: string, title: string): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          scheduled_publish_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (updateError) {
        console.error(`News Scheduler: Erro ao publicar artigo "${title}":`, updateError);
      } else {
        console.log(`News Scheduler: Artigo "${title}" publicado com sucesso!`);
      }
    } catch (error) {
      console.error(`News Scheduler: Erro ao publicar artigo "${title}":`, error);
    }
  }

  /**
   * Verifica manualmente os artigos agendados (útil para testes)
   */
  async checkNow(): Promise<void> {
    console.log('News Scheduler: Verificação manual iniciada');
    await this.checkAndPublishScheduledArticles();
  }
}

// Exportar uma instância singleton
export const newsSchedulerService = new NewsSchedulerService();

export default newsSchedulerService;


