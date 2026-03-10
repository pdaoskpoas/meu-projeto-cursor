import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/supabase-helpers';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface CreateReportInput {
  // Informações do denunciante
  reporter_id: string;
  reporter_email?: string;
  reporter_name?: string;
  
  // Informações do denunciado
  reported_user_id?: string;
  reported_user_name?: string;
  
  // Tipo de conteúdo denunciado
  content_type: 'animal' | 'event' | 'user' | 'message' | 'conversation' | 'profile' | 'other';
  content_id?: string;
  
  // Detalhes da denúncia
  reason: string;
  description: string;
  category?: 'fake_info' | 'scam' | 'inappropriate' | 'spam' | 'harassment' | 'other';
  
  // Localização e evidências
  report_location?: string;
  evidence_urls?: string[];
  
  // IDs relacionados
  conversation_id?: string;
  message_id?: string;
  animal_id?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter_email?: string;
  reporter_name?: string;
  reported_user_id?: string;
  reported_user_name?: string;
  content_type: string;
  content_id?: string;
  reason: string;
  description: string;
  category?: string;
  report_location?: string;
  evidence_urls?: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_id?: string;
  admin_notes?: string;
  admin_action?: string;
  reviewed_at?: string;
  conversation_id?: string;
  message_id?: string;
  animal_id?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CLASSE DE SERVIÇO DE DENÚNCIAS
// =====================================================

class ReportService {
  
  /**
   * Criar uma nova denúncia
   */
  async createReport(input: CreateReportInput): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: input.reporter_id,
          reporter_email: input.reporter_email,
          reporter_name: input.reporter_name,
          reported_user_id: input.reported_user_id,
          reported_user_name: input.reported_user_name,
          content_type: input.content_type,
          content_id: input.content_id,
          reason: input.reason,
          description: input.description,
          category: input.category || 'other',
          report_location: input.report_location,
          evidence_urls: input.evidence_urls || [],
          conversation_id: input.conversation_id,
          message_id: input.message_id,
          animal_id: input.animal_id,
          status: 'pending',
          priority: this.calculatePriority(input.category)
        })
        .select()
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      return data;
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      throw error;
    }
  }
  
  /**
   * Denunciar um animal
   */
  async reportAnimal(
    animalId: string,
    animalName: string,
    reporterId: string,
    reporterName: string,
    reporterEmail: string,
    reason: string,
    description: string,
    category: CreateReportInput['category'],
    reportLocation: string
  ): Promise<Report> {
    try {
      // Buscar informações do proprietário do animal
      const { data: animal } = await supabase
        .from('animals')
        .select('owner_id, profiles!animals_owner_id_fkey(id, name, email)')
        .eq('id', animalId)
        .single();
      
      const owner = animal?.profiles as { id: string; name: string; email: string } | undefined;
      
      return await this.createReport({
        reporter_id: reporterId,
        reporter_email: reporterEmail,
        reporter_name: reporterName,
        reported_user_id: owner?.id,
        reported_user_name: owner?.name,
        content_type: 'animal',
        content_id: animalId,
        reason,
        description,
        category,
        report_location: reportLocation,
        animal_id: animalId
      });
    } catch (error) {
      console.error('Erro ao denunciar animal:', error);
      throw error;
    }
  }

  /**
   * Denunciar um evento
   */
  async reportEvent(
    eventId: string,
    eventTitle: string,
    organizerId: string | null | undefined,
    organizerName: string | undefined,
    reporterId: string,
    reporterName: string,
    reporterEmail: string,
    reason: string,
    description: string,
    category: CreateReportInput['category'],
    reportLocation: string
  ): Promise<Report> {
    try {
      return await this.createReport({
        reporter_id: reporterId,
        reporter_email: reporterEmail,
        reporter_name: reporterName,
        reported_user_id: organizerId || undefined,
        reported_user_name: organizerName || eventTitle,
        content_type: 'event',
        content_id: eventId,
        reason,
        description,
        category,
        report_location: reportLocation
      });
    } catch (error) {
      console.error('Erro ao denunciar evento:', error);
      throw error;
    }
  }
  
  /**
   * Denunciar uma mensagem ou conversa
   */
  async reportMessage(
    conversationId: string,
    messageId: string | undefined,
    reporterId: string,
    reporterName: string,
    reporterEmail: string,
    reportedUserId: string,
    reportedUserName: string,
    reason: string,
    description: string,
    category: CreateReportInput['category']
  ): Promise<Report> {
    try {
      return await this.createReport({
        reporter_id: reporterId,
        reporter_email: reporterEmail,
        reporter_name: reporterName,
        reported_user_id: reportedUserId,
        reported_user_name: reportedUserName,
        content_type: messageId ? 'message' : 'conversation',
        content_id: messageId || conversationId,
        reason,
        description,
        category,
        report_location: `/dashboard/messages?conversation=${conversationId}`,
        conversation_id: conversationId,
        message_id: messageId
      });
    } catch (error) {
      console.error('Erro ao denunciar mensagem:', error);
      throw error;
    }
  }
  
  /**
   * Denunciar um usuário/perfil
   */
  async reportUser(
    userId: string,
    userName: string,
    reporterId: string,
    reporterName: string,
    reporterEmail: string,
    reason: string,
    description: string,
    category: CreateReportInput['category'],
    reportLocation: string
  ): Promise<Report> {
    try {
      return await this.createReport({
        reporter_id: reporterId,
        reporter_email: reporterEmail,
        reporter_name: reporterName,
        reported_user_id: userId,
        reported_user_name: userName,
        content_type: 'user',
        content_id: userId,
        reason,
        description,
        category,
        report_location: reportLocation
      });
    } catch (error) {
      console.error('Erro ao denunciar usuário:', error);
      throw error;
    }
  }
  
  /**
   * Buscar denúncias do usuário
   */
  async getUserReports(userId: string): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw handleSupabaseError(error);
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar denúncias do usuário:', error);
      throw error;
    }
  }
  
  /**
   * Calcular prioridade da denúncia baseado na categoria
   */
  private calculatePriority(category?: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (category) {
      case 'scam':
      case 'harassment':
        return 'urgent';
      case 'fake_info':
      case 'inappropriate':
        return 'high';
      case 'spam':
        return 'medium';
      default:
        return 'low';
    }
  }
  
  // =================================================
  // ADMIN FUNCTIONS
  // =================================================
  
  /**
   * Admin: Buscar todas as denúncias com filtros
   */
  async adminGetReports(filters?: {
    status?: string;
    content_type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.content_type) {
        query = query.eq('content_type', filters.content_type);
      }
      
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw handleSupabaseError(error);
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar denúncias (admin):', error);
      throw error;
    }
  }
  
  /**
   * Admin: Atualizar status de uma denúncia
   */
  async adminUpdateReportStatus(
    reportId: string,
    adminId: string,
    status: 'under_review' | 'resolved' | 'rejected',
    adminNotes?: string,
    adminAction?: 'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned'
  ): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          status,
          admin_id: adminId,
          admin_notes: adminNotes,
          admin_action: adminAction,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar denúncia (admin):', error);
      throw error;
    }
  }
  
  /**
   * Admin: Obter estatísticas de denúncias
   */
  async adminGetReportStats(): Promise<{
    total: number;
    pending: number;
    under_review: number;
    resolved: number;
    rejected: number;
    by_category: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_reports_stats');
      
      if (error) throw handleSupabaseError(error);
      
      return data || {
        total: 0,
        pending: 0,
        under_review: 0,
        resolved: 0,
        rejected: 0,
        by_category: {},
        by_priority: {}
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de denúncias:', error);
      return {
        total: 0,
        pending: 0,
        under_review: 0,
        resolved: 0,
        rejected: 0,
        by_category: {},
        by_priority: {}
      };
    }
  }
}

// Exportar instância única (singleton)
export const reportService = new ReportService();

