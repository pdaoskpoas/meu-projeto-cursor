import { useState, useEffect, useCallback } from 'react';

interface BoostData {
  id: string;
  type: 'animal' | 'event';
  startTime: number;
  duration: number; // em horas
  isActive: boolean;
}

interface BoostManager {
  activeBoosts: BoostData[];
  isItemBoosted: (id: string, type: 'animal' | 'event') => boolean;
  getBoostTimeRemaining: (id: string, type: 'animal' | 'event') => number;
  addBoost: (id: string, type: 'animal' | 'event', duration?: number) => void;
  removeBoost: (id: string, type: 'animal' | 'event') => void;
  refreshBoosts: () => void;
}

const areBoostListsEqual = (current: BoostData[], next: BoostData[]) => {
  if (current.length !== next.length) return false;

  return current.every((boost, index) => {
    const nextBoost = next[index];
    return (
      boost.id === nextBoost.id &&
      boost.type === nextBoost.type &&
      boost.startTime === nextBoost.startTime &&
      boost.duration === nextBoost.duration &&
      boost.isActive === nextBoost.isActive
    );
  });
};

export const useBoostManager = (): BoostManager => {
  const [activeBoosts, setActiveBoosts] = useState<BoostData[]>([]);

  const refreshBoosts = useCallback(() => {
    try {
      const stored = localStorage.getItem('active_boosts');
      const boosts: BoostData[] = stored ? JSON.parse(stored) : [];

      // Filtrar apenas boosts que ainda estão ativos
      const currentTime = Date.now();
      const nextActiveBoosts = boosts.filter(boost => {
        const endTime = boost.startTime + (boost.duration * 60 * 60 * 1000);
        return currentTime < endTime && boost.isActive;
      });

      setActiveBoosts((currentBoosts) =>
        areBoostListsEqual(currentBoosts, nextActiveBoosts) ? currentBoosts : nextActiveBoosts
      );

      // Atualizar localStorage se houve mudanças
      if (nextActiveBoosts.length !== boosts.length) {
        localStorage.setItem('active_boosts', JSON.stringify(nextActiveBoosts));
      }
    } catch (error) {
      console.error('Erro ao carregar boosts:', error);
      setActiveBoosts([]);
    }
  }, []);

  // Carregar boosts do localStorage na inicialização
  useEffect(() => {
    refreshBoosts();

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        refreshBoosts();
      }
    };

    window.addEventListener('focus', refreshBoosts);
    window.addEventListener('storage', refreshBoosts);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    // Evita repintar a UI a cada segundo em listas grandes.
    const interval = setInterval(() => {
      refreshBoosts();
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshBoosts);
      window.removeEventListener('storage', refreshBoosts);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [refreshBoosts]);

  const saveBoosts = (boosts: BoostData[]) => {
    try {
      localStorage.setItem('active_boosts', JSON.stringify(boosts));
      setActiveBoosts(boosts);
    } catch (error) {
      console.error('Erro ao salvar boosts:', error);
    }
  };

  const isItemBoosted = (id: string, type: 'animal' | 'event'): boolean => {
    const currentTime = Date.now();
    return activeBoosts.some(boost => {
      const endTime = boost.startTime + (boost.duration * 60 * 60 * 1000);
      return boost.id === id && 
             boost.type === type && 
             boost.isActive && 
             currentTime < endTime;
    });
  };

  const getBoostTimeRemaining = (id: string, type: 'animal' | 'event'): number => {
    const currentTime = Date.now();
    const boost = activeBoosts.find(b => 
      b.id === id && 
      b.type === type && 
      b.isActive
    );
    
    if (!boost) return 0;
    
    const endTime = boost.startTime + (boost.duration * 60 * 60 * 1000);
    const remaining = Math.max(0, endTime - currentTime);
    
    return remaining;
  };

  const addBoost = (id: string, type: 'animal' | 'event', duration: number = 24) => {
    const currentTime = Date.now();
    
    // Remover boost existente do mesmo item, se houver
    const filteredBoosts = activeBoosts.filter(boost => 
      !(boost.id === id && boost.type === type)
    );
    
    // Adicionar novo boost
    const newBoost: BoostData = {
      id,
      type,
      startTime: currentTime,
      duration,
      isActive: true
    };
    
    const updatedBoosts = [...filteredBoosts, newBoost];
    saveBoosts(updatedBoosts);
    
    // Registrar no histórico de boosts
    const boostHistory = JSON.parse(localStorage.getItem('boost_history') || '[]');
    boostHistory.push({
      ...newBoost,
      timestamp: currentTime
    });
    localStorage.setItem('boost_history', JSON.stringify(boostHistory));
  };

  const removeBoost = (id: string, type: 'animal' | 'event') => {
    const updatedBoosts = activeBoosts.filter(boost => 
      !(boost.id === id && boost.type === type)
    );
    saveBoosts(updatedBoosts);
  };

  return {
    activeBoosts,
    isItemBoosted,
    getBoostTimeRemaining,
    addBoost,
    removeBoost,
    refreshBoosts
  };
};




