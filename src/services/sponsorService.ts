/**
 * =============================================================================
 * SPONSOR SERVICE - GERENCIAMENTO PROFISSIONAL DE PATROCINADORES
 * =============================================================================
 * 
 * Funcionalidades:
 * - CRUD completo de patrocinadores
 * - Upload de logos em múltiplos formatos
 * - Agendamento de campanhas
 * - Analytics (impressões e cliques)
 * - Ativação/desativação
 * - Priorização de exibição
 * 
 * =============================================================================
 */

import { supabase } from '@/lib/supabase';
import { StorageServiceV2 } from './storageServiceV2';

// =============================================================================
// TIPOS
// =============================================================================

export interface Sponsor {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  logo_horizontal_url?: string;
  logo_square_url?: string;
  logo_vertical_url?: string;
  is_active: boolean;
  display_priority: number;
  start_date?: string;
  end_date?: string;
  display_locations: string[];
  click_count: number;
  impression_count: number;
  linked_profile_id?: string;
  click_action_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSponsorData {
  name: string;
  description?: string;
  website_url?: string;
  is_active?: boolean;
  display_priority?: number;
  start_date?: string;
  end_date?: string;
  display_locations?: string[];
  linked_profile_id?: string | null;
  click_action_enabled?: boolean;
}

export interface UploadLogosData {
  logoFile?: File; // Logo principal
  logoHorizontalFile?: File; // Logo landscape (4:1)
  logoSquareFile?: File; // Logo quadrado (1:1)
  logoVerticalFile?: File; // Logo portrait (1:4)
}

// =============================================================================
// CLASSE PRINCIPAL
// =============================================================================

export class SponsorService {
  /**
   * Criar novo patrocinador
   */
  static async createSponsor(data: CreateSponsorData): Promise<{ success: boolean; sponsor?: Sponsor; error?: string }> {
    try {
      console.log('[SponsorService] 🏢 Criando patrocinador:', data.name);

      const { data: sponsor, error } = await supabase
        .from('sponsors')
        .insert({
          name: data.name,
          description: data.description,
          website_url: data.website_url,
          is_active: data.is_active ?? false, // Inativo por padrão até ter logo
          display_priority: data.display_priority ?? 0,
          start_date: data.start_date,
          end_date: data.end_date,
          display_locations: data.display_locations ?? [],
        })
        .select()
        .single();

      if (error) {
        console.error('[SponsorService] ❌ Erro ao criar patrocinador:', error);
        return { success: false, error: error.message };
      }

      console.log('[SponsorService] ✅ Patrocinador criado:', sponsor.id);
      return { success: true, sponsor };
    } catch (error: unknown) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload de logos do patrocinador
   */
  static async uploadLogos(
    sponsorId: string,
    logos: UploadLogosData
  ): Promise<{ success: boolean; urls?: Partial<Record<string, string>>; error?: string }> {
    try {
      console.log('[SponsorService] 📤 Fazendo upload de logos para patrocinador:', sponsorId);

      const urls: Partial<Record<string, string>> = {};

      // Upload logo principal
      if (logos.logoFile) {
        const result = await StorageServiceV2.uploadFile({
          bucket: 'sponsor-logos',
          path: `${sponsorId}/logo.${this.getFileExtension(logos.logoFile)}`,
          file: logos.logoFile,
          options: {
            compress: true,
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.9,
          },
        });

        if (result.success && result.url) {
          urls.logo_url = result.url;
        }
      }

      // Upload logo horizontal (landscape 4:1)
      if (logos.logoHorizontalFile) {
        const result = await StorageServiceV2.uploadFile({
          bucket: 'sponsor-logos',
          path: `${sponsorId}/logo_horizontal.${this.getFileExtension(logos.logoHorizontalFile)}`,
          file: logos.logoHorizontalFile,
          options: {
            compress: true,
            maxWidth: 1200,
            maxHeight: 300,
            quality: 0.9,
          },
        });

        if (result.success && result.url) {
          urls.logo_horizontal_url = result.url;
        }
      }

      // Upload logo quadrado (1:1)
      if (logos.logoSquareFile) {
        const result = await StorageServiceV2.uploadFile({
          bucket: 'sponsor-logos',
          path: `${sponsorId}/logo_square.${this.getFileExtension(logos.logoSquareFile)}`,
          file: logos.logoSquareFile,
          options: {
            compress: true,
            maxWidth: 600,
            maxHeight: 600,
            quality: 0.9,
          },
        });

        if (result.success && result.url) {
          urls.logo_square_url = result.url;
        }
      }

      // Upload logo vertical (portrait 1:4)
      if (logos.logoVerticalFile) {
        const result = await StorageServiceV2.uploadFile({
          bucket: 'sponsor-logos',
          path: `${sponsorId}/logo_vertical.${this.getFileExtension(logos.logoVerticalFile)}`,
          file: logos.logoVerticalFile,
          options: {
            compress: true,
            maxWidth: 300,
            maxHeight: 1200,
            quality: 0.9,
          },
        });

        if (result.success && result.url) {
          urls.logo_vertical_url = result.url;
        }
      }

      // Atualizar patrocinador com URLs
      if (Object.keys(urls).length > 0) {
        const { error } = await supabase
          .from('sponsors')
          .update(urls)
          .eq('id', sponsorId);

        if (error) {
          console.error('[SponsorService] ❌ Erro ao atualizar URLs:', error);
          return { success: false, error: error.message };
        }
      }

      console.log('[SponsorService] ✅ Logos enviados:', Object.keys(urls));
      return { success: true, urls };
    } catch (error: unknown) {
      console.error('[SponsorService] ❌ Erro no upload:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar patrocinadores ativos
   */
  static async getActiveSponsors(location?: string): Promise<Sponsor[]> {
    try {
      let query = supabase
        .from('active_sponsors')
        .select('*');

      if (location) {
        query = query.contains('display_locations', [location]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SponsorService] ❌ Erro ao buscar patrocinadores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return [];
    }
  }

  /**
   * Listar todos os patrocinadores (admin)
   */
  static async getAllSponsors(): Promise<Sponsor[]> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('display_priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SponsorService] ❌ Erro ao buscar patrocinadores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return [];
    }
  }

  /**
   * Obter patrocinador por ID
   */
  static async getSponsorById(id: string): Promise<Sponsor | null> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[SponsorService] ❌ Erro ao buscar patrocinador:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return null;
    }
  }

  /**
   * Atualizar patrocinador
   */
  static async updateSponsor(
    id: string,
    updates: Partial<CreateSponsorData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[SponsorService] 📝 Atualizando patrocinador:', id);

      const { error } = await supabase
        .from('sponsors')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('[SponsorService] ❌ Erro ao atualizar:', error);
        return { success: false, error: error.message };
      }

      console.log('[SponsorService] ✅ Patrocinador atualizado');
      return { success: true };
    } catch (error: unknown) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ativar/desativar patrocinador
   */
  static async toggleSponsorStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[SponsorService] ${isActive ? '✅ Ativando' : '⏸️  Desativando'} patrocinador:`, id);

      const { error } = await supabase
        .from('sponsors')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('[SponsorService] ❌ Erro ao atualizar status:', error);
        return { success: false, error: error.message };
      }

      console.log('[SponsorService] ✅ Status atualizado');
      return { success: true };
    } catch (error: unknown) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletar patrocinador
   */
  static async deleteSponsor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[SponsorService] 🗑️  Deletando patrocinador:', id);

      // Deletar logos primeiro
      await this.deleteAllLogos(id);

      // Deletar registro
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[SponsorService] ❌ Erro ao deletar:', error);
        return { success: false, error: error.message };
      }

      console.log('[SponsorService] ✅ Patrocinador deletado');
      return { success: true };
    } catch (error: unknown) {
      console.error('[SponsorService] ❌ Erro crítico:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletar todos os logos de um patrocinador
   */
  private static async deleteAllLogos(sponsorId: string): Promise<void> {
    try {
      const files = await StorageServiceV2.listFiles('sponsor-logos', sponsorId);
      if (files.length > 0) {
        await StorageServiceV2.deleteFiles('sponsor-logos', files);
      }
    } catch (error) {
      console.error('[SponsorService] ⚠️  Erro ao deletar logos:', error);
    }
  }

  /**
   * Registrar impressão
   */
  static async recordImpression(sponsorId: string): Promise<void> {
    try {
      await supabase.rpc('increment_sponsor_impression', { sponsor_id: sponsorId });
    } catch (error) {
      console.error('[SponsorService] ⚠️  Erro ao registrar impressão:', error);
    }
  }

  /**
   * Registrar clique
   */
  static async recordClick(sponsorId: string): Promise<void> {
    try {
      await supabase.rpc('increment_sponsor_click', { sponsor_id: sponsorId });
    } catch (error) {
      console.error('[SponsorService] ⚠️  Erro ao registrar clique:', error);
    }
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  private static getFileExtension(file: File): string {
    const parts = file.name.split('.');
    return parts[parts.length - 1] || 'png';
  }
}

export default SponsorService;




