/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { favoritesService, type FavoriteAnimalData } from '@/services/favoritesService';

interface FavoritesContextType {
  favorites: FavoriteAnimalData[];
  isLoading: boolean;
  addToFavorites: (animalId: string) => Promise<void>;
  removeFromFavorites: (animalId: string) => Promise<void>;
  toggleFavorite: (animalId: string) => Promise<void>;
  isFavorite: (animalId: string) => boolean;
  isToggling: (animalId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteAnimalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refs para acesso estável dentro de callbacks memoizados
  const userRef = useRef(user);
  userRef.current = user;
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  // Guard contra cliques múltiplos no mesmo item
  const togglingIdsRef = useRef<Set<string>>(new Set());

  // Epoch monotônico — incrementado em cada mutação (add/remove/load)
  // Impede que respostas antigas sobrescrevam estado mais recente
  const syncEpochRef = useRef(0);

  const loadFavorites = useCallback(async () => {
    const epoch = ++syncEpochRef.current;
    setIsLoading(true);
    try {
      const data = await favoritesService.getUserFavorites();
      // Só aplica se nenhuma operação mais recente aconteceu
      if (syncEpochRef.current === epoch) {
        setFavorites(data);
      }
    } catch {
      toast('Erro ao carregar favoritos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Depender de user?.id (primitivo) em vez do objeto user inteiro
  const userId = user?.id;
  useEffect(() => {
    if (userId) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [userId, loadFavorites]);

  const addToFavorites = useCallback(async (animalId: string) => {
    if (!userRef.current) {
      toast('Você precisa estar logado para adicionar favoritos');
      return;
    }

    // Já é favorito — noop silencioso
    if (favoritesRef.current.some(fav => fav.id === animalId)) {
      return;
    }

    // Previne cliques múltiplos no mesmo item
    if (togglingIdsRef.current.has(animalId)) return;
    togglingIdsRef.current.add(animalId);

    // Incrementa epoch — invalida loads anteriores em flight
    syncEpochRef.current++;

    // OPTIMISTIC UPDATE — atualiza UI imediatamente com placeholder
    const optimisticEntry: FavoriteAnimalData = {
      id: animalId,
      name: '',
      breed: '',
      harasName: '',
      location: '',
      image: '',
      views: 0,
      featured: false,
      gender: '',
      age: 0,
      coat: '',
      titles: [],
    };
    setFavorites(prev => [optimisticEntry, ...prev]);

    try {
      // 1 única requisição: INSERT no banco
      const result = await favoritesService.addFavorite(animalId);

      if (result.success) {
        toast('Adicionado aos favoritos');
        // MERGE STRATEGY — enriquece placeholders sem disturbar o set de IDs otimista
        // Itera sobre prev (estado local), não sobre serverData, então:
        //   - itens removidos otimisticamente NÃO são re-adicionados
        //   - placeholders SÃO substituídos por dados reais do server
        favoritesService.getUserFavorites().then(serverData => {
          const serverMap = new Map(serverData.map(f => [f.id, f]));
          setFavorites(prev =>
            prev.map(fav => serverMap.get(fav.id) || fav)
          );
        }).catch(() => { /* sync silencioso */ });
      } else {
        // ROLLBACK — remove placeholder
        setFavorites(prev => prev.filter(fav => fav.id !== animalId));
        toast(result.error || 'Erro ao adicionar favorito');
      }
    } catch {
      // ROLLBACK
      setFavorites(prev => prev.filter(fav => fav.id !== animalId));
      toast('Erro ao adicionar favorito');
    } finally {
      togglingIdsRef.current.delete(animalId);
    }
  }, []);

  const removeFromFavorites = useCallback(async (animalId: string) => {
    if (!userRef.current) {
      toast('Você precisa estar logado');
      return;
    }

    const animalToRemove = favoritesRef.current.find(fav => fav.id === animalId);
    if (!animalToRemove) {
      return;
    }

    // Previne cliques múltiplos no mesmo item
    if (togglingIdsRef.current.has(animalId)) return;
    togglingIdsRef.current.add(animalId);

    // Incrementa epoch — invalida loads e syncs anteriores em flight
    syncEpochRef.current++;

    // OPTIMISTIC UPDATE — remove da UI imediatamente
    const previousFavorites = favoritesRef.current;
    setFavorites(prev => prev.filter(fav => fav.id !== animalId));
    toast(`${animalToRemove.name} removido dos favoritos`);

    try {
      // 1 única requisição: DELETE no banco
      const result = await favoritesService.removeFavorite(animalId);

      if (!result.success) {
        // ROLLBACK — restaura estado anterior
        setFavorites(previousFavorites);
        toast(result.error || 'Erro ao remover favorito');
      }
    } catch {
      // ROLLBACK
      setFavorites(previousFavorites);
      toast('Erro ao remover favorito');
    } finally {
      togglingIdsRef.current.delete(animalId);
    }
  }, []);

  const isFavorite = useCallback((animalId: string) => {
    return favoritesRef.current.some(fav => fav.id === animalId);
  }, []);

  const isToggling = useCallback((animalId: string) => {
    return togglingIdsRef.current.has(animalId);
  }, []);

  const toggleFavorite = useCallback(async (animalId: string) => {
    if (favoritesRef.current.some(fav => fav.id === animalId)) {
      await removeFromFavorites(animalId);
    } else {
      await addToFavorites(animalId);
    }
  }, [removeFromFavorites, addToFavorites]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  const value = useMemo(() => ({
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    isToggling,
    refreshFavorites
  }), [favorites, isLoading, addToFavorites, removeFromFavorites, toggleFavorite, isFavorite, isToggling, refreshFavorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
