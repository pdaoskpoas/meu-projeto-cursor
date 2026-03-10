// Função para calcular tempo de leitura baseado no conteúdo
export const calculateReadingTime = (content: string): number => {
  // Remove HTML tags para contar apenas texto
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Conta palavras (aproximadamente 200 palavras por minuto)
  const wordsPerMinute = 200;
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  
  // Calcula minutos de leitura
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  // Mínimo de 1 minuto
  return Math.max(1, readingTime);
};

// Função para verificar se um artigo agendado deve ser publicado
export const checkScheduledArticles = <T extends { isPublished: boolean; publishedAt?: string | null }>(articles: T[]): T[] => {
  // Função simplificada - agendamento será implementado futuramente
  return articles;
};

// Função para formatar data/hora para agendamento
export const formatDateTimeForScheduling = (date: Date): string => {
  return date.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM
};

// Função para validar se a data de agendamento é futura
export const isValidScheduledDate = (dateString: string): boolean => {
  const scheduledDate = new Date(dateString);
  const now = new Date();
  return scheduledDate > now;
};
