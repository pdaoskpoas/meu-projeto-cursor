import { supabase } from '@/lib/supabase';
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers';

export interface AdSenseConfig {
  id: string;
  global_script: string | null;
  listing_banner: string | null;
  article_top_banner: string | null;
  article_mid_banner: string | null;
  article_bottom_banner: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdSenseConfigUpdate {
  global_script?: string | null;
  listing_banner?: string | null;
  article_top_banner?: string | null;
  article_mid_banner?: string | null;
  article_bottom_banner?: string | null;
  is_active?: boolean;
}

class MonetizationService {
  /**
   * Buscar configuração ativa do AdSense
   * Retorna null se não houver configuração ativa
   */
  async getActiveConfig(): Promise<AdSenseConfig | null> {
    try {
      logSupabaseOperation('Get active AdSense config');

      const { data, error } = await supabase
        .from('adsense_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        // Se não encontrado, retornar null (não é erro)
        if (error.code === 'PGRST116') {
          logSupabaseOperation('No active AdSense config found');
          return null;
        }
        throw handleSupabaseError(error);
      }

      logSupabaseOperation('Get active AdSense config success');
      return data as AdSenseConfig;
    } catch (error) {
      logSupabaseOperation('Get active AdSense config error', null, error);
      throw error;
    }
  }

  /**
   * Buscar todas as configurações (apenas para admin)
   */
  async getAllConfigs(): Promise<AdSenseConfig[]> {
    try {
      logSupabaseOperation('Get all AdSense configs');

      const { data, error } = await supabase
        .from('adsense_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw handleSupabaseError(error);

      logSupabaseOperation('Get all AdSense configs success', { count: data?.length || 0 });
      return (data || []) as AdSenseConfig[];
    } catch (error) {
      logSupabaseOperation('Get all AdSense configs error', null, error);
      throw error;
    }
  }

  /**
   * Criar nova configuração
   */
  async createConfig(config: AdSenseConfigUpdate): Promise<AdSenseConfig> {
    try {
      logSupabaseOperation('Create AdSense config');

      // Se está marcando como ativo, desativar outras configurações
      if (config.is_active === true) {
        await supabase
          .from('adsense_config')
          .update({ is_active: false })
          .eq('is_active', true);
      }

      const { data, error } = await supabase
        .from('adsense_config')
        .insert({
          global_script: config.global_script || null,
          listing_banner: config.listing_banner || null,
          article_top_banner: config.article_top_banner || null,
          article_mid_banner: config.article_mid_banner || null,
          article_bottom_banner: config.article_bottom_banner || null,
          is_active: config.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      logSupabaseOperation('Create AdSense config success');
      return data as AdSenseConfig;
    } catch (error) {
      logSupabaseOperation('Create AdSense config error', null, error);
      throw error;
    }
  }

  /**
   * Atualizar configuração existente
   */
  async updateConfig(id: string, config: AdSenseConfigUpdate): Promise<AdSenseConfig> {
    try {
      logSupabaseOperation('Update AdSense config', { id });

      // Se está marcando como ativo, desativar outras configurações
      if (config.is_active === true) {
        await supabase
          .from('adsense_config')
          .update({ is_active: false })
          .neq('id', id)
          .eq('is_active', true);
      }

      const { data, error } = await supabase
        .from('adsense_config')
        .update({
          ...(config.global_script !== undefined && { global_script: config.global_script }),
          ...(config.listing_banner !== undefined && { listing_banner: config.listing_banner }),
          ...(config.article_top_banner !== undefined && { article_top_banner: config.article_top_banner }),
          ...(config.article_mid_banner !== undefined && { article_mid_banner: config.article_mid_banner }),
          ...(config.article_bottom_banner !== undefined && { article_bottom_banner: config.article_bottom_banner }),
          ...(config.is_active !== undefined && { is_active: config.is_active }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      logSupabaseOperation('Update AdSense config success', { id });
      return data as AdSenseConfig;
    } catch (error) {
      logSupabaseOperation('Update AdSense config error', { id }, error);
      throw error;
    }
  }

  /**
   * Deletar configuração
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      logSupabaseOperation('Delete AdSense config', { id });

      const { error } = await supabase
        .from('adsense_config')
        .delete()
        .eq('id', id);

      if (error) throw handleSupabaseError(error);

      logSupabaseOperation('Delete AdSense config success', { id });
    } catch (error) {
      logSupabaseOperation('Delete AdSense config error', { id }, error);
      throw error;
    }
  }
}

export const monetizationService = new MonetizationService();
