import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import { getOwnerDisplayName } from '@/utils/ownerDisplayName';
import { normalizeSupabaseImages } from '@/utils/animalCard';

type FavoriteRow = Database['public']['Tables']['favorites']['Row'];
type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];

export interface FavoriteAnimalData {
  id: string;
  name: string;
  breed: string;
  harasName: string;
  location: string;
  image: string;
  views: number;
  featured: boolean;
  gender: string;
  age: number;
  coat: string;
  titles: string[];
}

class FavoritesService {
  /**
   * Busca todos os favoritos do usuário logado
   */
  async getUserFavorites(): Promise<FavoriteAnimalData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      // Busca os favoritos com os dados completos dos animais
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          animal_id,
          created_at,
          animals!inner (
            id,
            name,
            breed,
            gender,
            coat,
            birth_date,
            current_city,
            current_state,
            ad_status,
            images,
            owner_id,
            profiles!animals_owner_id_fkey (
              name,
              property_name,
              account_type
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar favoritos:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      // Mapeia os dados para o formato esperado pelo contexto
      interface SupabaseFavoriteAnimal {
        ad_status?: string;
        profiles?: Record<string, unknown>;
        [key: string]: unknown;
      }
      interface SupabaseFavoriteRecord {
        animals?: SupabaseFavoriteAnimal;
        [key: string]: unknown;
      }
      const favorites: FavoriteAnimalData[] = data
        .filter((fav): fav is SupabaseFavoriteRecord & { animals: SupabaseFavoriteAnimal } => !!fav.animals)
        .filter(fav => {
          const animal = fav.animals;
          // Filtra apenas animais ativos (segurança adicional)
          return animal.ad_status === 'active';
        })
        .map(fav => {
          const animal = fav.animals;
          const profile = animal.profiles as Record<string, unknown> | undefined;
          
          // Obtém as imagens reais do animal
          const images = normalizeSupabaseImages(animal);
          const firstImage = images.length > 0 ? images[0] : '';
          
          // Obtém o nome do proprietário correto
          const ownerDisplayName = getOwnerDisplayName(
            profile?.account_type,
            profile?.name,
            profile?.property_name
          );
          
          return {
            id: animal.id,
            name: animal.name || 'Animal sem nome',
            breed: animal.breed || 'Raça não informada',
            harasName: ownerDisplayName,
            location: `${animal.current_city || ''}, ${animal.current_state || ''}`.trim() || 'Localização não informada',
            image: firstImage, // Primeira imagem real do animal do Supabase Storage
            views: 0, // Views serão buscadas de outra tabela se necessário
            featured: false,
            gender: animal.gender || 'Não informado',
            age: animal.birth_date 
              ? new Date().getFullYear() - new Date(animal.birth_date).getFullYear()
              : 0,
            coat: animal.coat || 'Não informado',
            titles: [] // Títulos podem ser adicionados futuramente
          };
        });

      return favorites;
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  }

  /**
   * Adiciona um animal aos favoritos
   */
  async addFavorite(animalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Adiciona aos favoritos diretamente
      // O Supabase irá validar o foreign key automaticamente
      const favoriteData: FavoriteInsert = {
        user_id: user.id,
        animal_id: animalId
      };

      const { error } = await supabase
        .from('favorites')
        .insert(favoriteData);

      if (error) {
        // Se o erro for de duplicação, considera como sucesso
        if (error.code === '23505') {
          return { success: true };
        }
        
        // Se o erro for de foreign key (animal não existe)
        if (error.code === '23503') {
          return { success: false, error: 'Animal não encontrado ou não está mais disponível' };
        }
        
        console.error('Erro ao adicionar favorito:', error);
        return { success: false, error: 'Erro ao salvar favorito' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      return { success: false, error: 'Erro ao salvar favorito' };
    }
  }

  /**
   * Remove um animal dos favoritos
   */
  async removeFavorite(animalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('animal_id', animalId);

      if (error) {
        console.error('Erro ao remover favorito:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      return { success: false, error: 'Erro desconhecido' };
    }
  }

  /**
   * Verifica se um animal está nos favoritos
   */
  async isFavorite(animalId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('animal_id', animalId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar favorito:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  }

  /**
   * Limpa todos os favoritos do usuário (útil para testes)
   */
  async clearAllFavorites(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao limpar favoritos:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar favoritos:', error);
      return { success: false, error: 'Erro desconhecido' };
    }
  }
}

export const favoritesService = new FavoritesService();

