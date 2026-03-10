/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  // Carrega os favoritos do Supabase quando o usuário fizer login
  const showToast = useCallback((message: string) => {
    toast(message);
  }, []);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await favoritesService.getUserFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      showToast('Erro ao carregar favoritos');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      // Limpa favoritos quando usuário fizer logout
      setFavorites([]);
    }
  }, [user, loadFavorites]);

  

  const addToFavorites = async (animalId: string) => {
    // Verifica se usuário está autenticado
    if (!user) {
      showToast('Você precisa estar logado para adicionar favoritos');
      return;
    }

    // Verifica se já está nos favoritos
    if (favorites.some(fav => fav.id === animalId)) {
      showToast('Este animal já está nos seus favoritos');
      return;
    }

    try {
      const result = await favoritesService.addFavorite(animalId);
      
      if (result.success) {
        // Recarrega a lista de favoritos para obter os dados atualizados
        await loadFavorites();
        
        // Busca o animal na lista atualizada
        const updatedFavorites = await favoritesService.getUserFavorites();
        const animal = updatedFavorites.find(fav => fav.id === animalId);
        const animalName = animal?.name || 'Animal';
        
        showToast(`${animalName} adicionado aos favoritos`);
      } else {
        showToast(result.error || 'Erro ao adicionar favorito');
      }
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      showToast('Erro ao adicionar favorito');
    }
  };

  const removeFromFavorites = async (animalId: string) => {
    // Verifica se usuário está autenticado
    if (!user) {
      showToast('Você precisa estar logado');
      return;
    }

    const animalToRemove = favorites.find(fav => fav.id === animalId);
    if (!animalToRemove) {
      return;
    }

    try {
      const result = await favoritesService.removeFavorite(animalId);
      
      if (result.success) {
        // Remove localmente para feedback imediato
        setFavorites(prev => prev.filter(fav => fav.id !== animalId));
        showToast(`${animalToRemove.name} removido dos favoritos`);
      } else {
        showToast(result.error || 'Erro ao remover favorito');
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      showToast('Erro ao remover favorito');
    }
  };

  const isFavorite = (animalId: string) => {
    return favorites.some(fav => fav.id === animalId);
  };

  const toggleFavorite = async (animalId: string) => {
    if (isFavorite(animalId)) {
      await removeFromFavorites(animalId);
    } else {
      await addToFavorites(animalId);
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
