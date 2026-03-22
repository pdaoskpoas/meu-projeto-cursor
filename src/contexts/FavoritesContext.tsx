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

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await favoritesService.getUserFavorites();
      setFavorites(data);
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

    if (favoritesRef.current.some(fav => fav.id === animalId)) {
      toast('Este animal já está nos seus favoritos');
      return;
    }

    try {
      const result = await favoritesService.addFavorite(animalId);

      if (result.success) {
        await loadFavorites();
        const updatedFavorites = await favoritesService.getUserFavorites();
        const animal = updatedFavorites.find(fav => fav.id === animalId);
        const animalName = animal?.name || 'Animal';
        toast(`${animalName} adicionado aos favoritos`);
      } else {
        toast(result.error || 'Erro ao adicionar favorito');
      }
    } catch {
      toast('Erro ao adicionar favorito');
    }
  }, [loadFavorites]);

  const removeFromFavorites = useCallback(async (animalId: string) => {
    if (!userRef.current) {
      toast('Você precisa estar logado');
      return;
    }

    const animalToRemove = favoritesRef.current.find(fav => fav.id === animalId);
    if (!animalToRemove) {
      return;
    }

    try {
      const result = await favoritesService.removeFavorite(animalId);

      if (result.success) {
        setFavorites(prev => prev.filter(fav => fav.id !== animalId));
        toast(`${animalToRemove.name} removido dos favoritos`);
      } else {
        toast(result.error || 'Erro ao remover favorito');
      }
    } catch {
      toast('Erro ao remover favorito');
    }
  }, []);

  const isFavorite = useCallback((animalId: string) => {
    return favoritesRef.current.some(fav => fav.id === animalId);
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
    refreshFavorites
  }), [favorites, isLoading, addToFavorites, removeFromFavorites, toggleFavorite, isFavorite, refreshFavorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
