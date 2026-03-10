import { supabase } from '@/lib/supabase';
import type { AnimalTitle } from '@/types/animal';

/**
 * Serviço para gerenciar títulos e conquistas de animais
 * Trabalha com a tabela animal_titles no Supabase
 */
export const animalTitlesService = {
  /**
   * Buscar todos os títulos de um animal
   * @param animalId - ID do animal
   * @returns Array de títulos ordenados por data (mais recente primeiro)
   */
  async getTitles(animalId: string): Promise<AnimalTitle[]> {
    try {
      const { data, error } = await supabase
        .from('animal_titles')
        .select('*')
        .eq('animal_id', animalId)
        .order('event_date', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar títulos:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro em getTitles:', error);
      return [];
    }
  },

  /**
   * Salvar títulos de um animal (substitui todos os títulos existentes)
   * @param animalId - ID do animal
   * @param titles - Array de títulos a salvar
   */
  async saveTitles(animalId: string, titles: AnimalTitle[]): Promise<void> {
    try {
      // Deletar todos os títulos antigos do animal
      const { error: deleteError } = await supabase
        .from('animal_titles')
        .delete()
        .eq('animal_id', animalId);
      
      if (deleteError) {
        console.error('Erro ao deletar títulos antigos:', deleteError);
        throw deleteError;
      }
      
      // Se não há títulos novos, apenas retorna
      if (!titles || titles.length === 0) {
        return;
      }
      
      // Filtrar títulos válidos (com campos obrigatórios preenchidos)
      const validTitles = titles.filter(t => 
        t.event_name?.trim() && 
        t.event_date?.trim() && 
        t.award?.trim()
      );
      
      if (validTitles.length === 0) {
        return;
      }
      
      // Inserir novos títulos
      const { error: insertError } = await supabase
        .from('animal_titles')
        .insert(
          validTitles.map(t => ({
            animal_id: animalId,
            event_name: t.event_name.trim(),
            event_date: t.event_date,
            award: t.award.trim(),
            notes: t.notes?.trim() || null
          }))
        );
      
      if (insertError) {
        console.error('Erro ao inserir novos títulos:', insertError);
        throw insertError;
      }
      
      console.log(`${validTitles.length} título(s) salvo(s) com sucesso para o animal ${animalId}`);
    } catch (error) {
      console.error('Erro em saveTitles:', error);
      throw error;
    }
  },

  /**
   * Adicionar um único título a um animal
   * @param animalId - ID do animal
   * @param title - Título a adicionar
   */
  async addTitle(animalId: string, title: AnimalTitle): Promise<AnimalTitle> {
    try {
      // Validar campos obrigatórios
      if (!title.event_name?.trim() || !title.event_date?.trim() || !title.award?.trim()) {
        throw new Error('Campos obrigatórios não preenchidos');
      }
      
      const { data, error } = await supabase
        .from('animal_titles')
        .insert({
          animal_id: animalId,
          event_name: title.event_name.trim(),
          event_date: title.event_date,
          award: title.award.trim(),
          notes: title.notes?.trim() || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar título:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro em addTitle:', error);
      throw error;
    }
  },

  /**
   * Atualizar um título existente
   * @param titleId - ID do título
   * @param updates - Campos a atualizar
   */
  async updateTitle(titleId: string, updates: Partial<AnimalTitle>): Promise<void> {
    try {
      const { error } = await supabase
        .from('animal_titles')
        .update(updates)
        .eq('id', titleId);
      
      if (error) {
        console.error('Erro ao atualizar título:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro em updateTitle:', error);
      throw error;
    }
  },

  /**
   * Deletar um título específico
   * @param titleId - ID do título
   */
  async deleteTitle(titleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('animal_titles')
        .delete()
        .eq('id', titleId);
      
      if (error) {
        console.error('Erro ao deletar título:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro em deleteTitle:', error);
      throw error;
    }
  },

  /**
   * Buscar animais com títulos (usando a view)
   * @param filters - Filtros opcionais
   * @returns Animais com seus títulos detalhados
   */
  async getAnimalsWithTitles(filters?: {
    ownerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    try {
      let query = supabase
        .from('animals_with_titles')
        .select('*');
      
      if (filters?.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar animais com títulos:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro em getAnimalsWithTitles:', error);
      return [];
    }
  }
};

export default animalTitlesService;

