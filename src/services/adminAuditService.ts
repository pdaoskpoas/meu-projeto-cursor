import { supabase } from '@/integrations/supabase/client';

interface AdminAuditPayload {
  action: string;
  adminId: string | null | undefined;
  resourceType: string;
  resourceId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  details?: unknown;
}

export async function logAdminAction(payload: AdminAuditPayload): Promise<void> {
  if (!payload.adminId) return;

  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    await supabase.from('admin_audit_log').insert({
      action: payload.action,
      admin_id: payload.adminId,
      resource_type: payload.resourceType,
      resource_id: payload.resourceId || null,
      old_data: payload.oldData ?? null,
      new_data: payload.newData ?? null,
      details: payload.details ?? null,
      user_agent: userAgent
    });
  } catch (error) {
    // Não bloquear fluxo principal por falha de auditoria
    console.error('Erro ao registrar auditoria admin:', error);
  }
}
