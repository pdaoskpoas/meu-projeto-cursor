/**
 * 🛡️ Admin Security Service
 * 
 * Serviço para operações administrativas seguras
 * Todas as operações validam role no backend
 */

import { supabase } from '@/lib/supabase';

interface AdminActionResult {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

class AdminSecurityService {
  /**
   * 🔒 Validar acesso admin (backend)
   */
  async validateAdminAccess(): Promise<{
    isAdmin: boolean;
    authenticated: boolean;
    userId: string | null;
    userEmail: string | null;
    message: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('validate_admin_access');

      if (error) {
        throw error;
      }

      return {
        isAdmin: data?.is_admin || false,
        authenticated: data?.authenticated || false,
        userId: data?.user_id || null,
        userEmail: data?.user_email || null,
        message: data?.message || 'Validation completed'
      };
    } catch (error) {
      console.error('Admin validation error:', error);
      return {
        isAdmin: false,
        authenticated: false,
        userId: null,
        userEmail: null,
        message: 'Validation failed'
      };
    }
  }

  /**
   * 🔒 Suspender usuário (protegido)
   */
  async suspendUser(
    userId: string,
    reason: string,
    email?: string
  ): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_suspend_user', {
        target_user_id: userId,
        suspension_reason: reason,
        suspension_email: email
      });

      if (error) {
        throw error;
      }

      return data as AdminActionResult;
    } catch (error) {
      console.error('Suspend user error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to suspend user'
      };
    }
  }

  /**
   * 🔒 Reativar usuário (protegido)
   */
  async unsuspendUser(userId: string): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_unsuspend_user', {
        target_user_id: userId
      });

      if (error) {
        throw error;
      }

      return data as AdminActionResult;
    } catch (error) {
      console.error('Unsuspend user error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to unsuspend user'
      };
    }
  }

  /**
   * 🔒 Atualizar plano de usuário (protegido)
   */
  async updateUserPlan(
    userId: string,
    newPlan: string,
    durationDays: number = 30,
    isAnnual: boolean = false
  ): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_plan', {
        target_user_id: userId,
        new_plan: newPlan,
        duration_days: durationDays,
        is_annual: isAnnual
      });

      if (error) {
        throw error;
      }

      return data as AdminActionResult;
    } catch (error) {
      console.error('Update plan error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to update plan'
      };
    }
  }

  /**
   * 🔒 Aprovar evento (protegido)
   */
  async approveEvent(
    eventId: string,
    notes?: string
  ): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_approve_event', {
        event_id: eventId,
        approval_notes: notes
      });

      if (error) {
        throw error;
      }

      return data as AdminActionResult;
    } catch (error) {
      console.error('Approve event error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to approve event'
      };
    }
  }

  /**
   * 🔒 Deletar animal (protegido)
   */
  async deleteAnimal(
    animalId: string,
    reason: string
  ): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_delete_animal', {
        animal_id: animalId,
        deletion_reason: reason
      });

      if (error) {
        throw error;
      }

      return data as AdminActionResult;
    } catch (error) {
      console.error('Delete animal error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to delete animal'
      };
    }
  }

  /**
   * 🔒 Obter estatísticas admin (protegido)
   */
  async getDashboardStats(): Promise<{
    total_users: number;
    suspended_users: number;
    paid_users: number;
    active_animals: number;
    active_events: number;
    active_suspensions: number;
    admin_actions_24h: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats_secure')
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return null;
    }
  }

  /**
   * 🔒 Migrar PII para criptografia (protegido)
   */
  async migratePIIEncryption(
    batchSize: number = 100,
    dryRun: boolean = true
  ): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_migrate_pii_to_encrypted', {
        batch_size: batchSize,
        dry_run: dryRun
      });

      if (error) {
        throw error;
      }

      return data as AdminActionResult;
    } catch (error) {
      console.error('Migrate PII error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to migrate PII'
      };
    }
  }
}

export const adminSecurityService = new AdminSecurityService();



