import { useState, useEffect } from 'react';
import { monetizationService, type AdSenseConfig } from '@/services/monetizationService';

/**
 * Hook para buscar configuração ativa do AdSense
 * Usado nas páginas de notícias para exibir anúncios
 */
export const useAdSenseConfig = () => {
  const [config, setConfig] = useState<AdSenseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const activeConfig = await monetizationService.getActiveConfig();
        setConfig(activeConfig);
      } catch (err) {
        console.error('Erro ao buscar configuração do AdSense:', err);
        setError('Erro ao carregar configuração de anúncios');
        setConfig(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
};
