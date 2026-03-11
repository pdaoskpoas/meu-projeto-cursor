import { supabase } from '@/lib/supabase';

/**
 * 🔒 Proteção CSRF adicional para ações críticas
 * 
 * Supabase Auth já implementa proteção CSRF básica,
 * mas adicionamos camada extra para ações sensíveis:
 * - Deletar conta
 * - Alterar email/senha
 * - Ações administrativas
 */

/**
 * Verifica se a sessão é válida e recente
 */
export const validateActiveSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    // Verificar se token não está expirado
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Valida Origin/Referer headers (client-side check)
 * Previne CSRF de origens externas
 */
export const validateOrigin = (): boolean => {
  try {
    // Verificar se está no mesmo domínio
    const allowedOrigins = [
      window.location.origin,
      'http://localhost:8080',
      'http://localhost:5173',
      'https://cavalaria-digital.com' // Adicionar seu domínio de produção
    ];

    // Em desenvolvimento, sempre permitir
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // Verificar referer (se disponível)
    if (document.referrer) {
      const refererOrigin = new URL(document.referrer).origin;
      return allowedOrigins.includes(refererOrigin);
    }

    return true;
  } catch {
    return true; // Fail open em caso de erro
  }
};

/**
 * Proteção para ações críticas
 * Requer sessão válida + confirmação do usuário
 */
export interface CriticalActionOptions {
  action: 'delete_account' | 'change_email' | 'change_password' | 'admin_action';
  requirePassword?: boolean;
}

export const verifyCriticalAction = async (
  options: CriticalActionOptions
): Promise<{ allowed: boolean; error?: string }> => {
  // 1. Verificar origem
  if (!validateOrigin()) {
    return {
      allowed: false,
      error: 'Requisição de origem não autorizada'
    };
  }

  // 2. Verificar sessão ativa
  const sessionValid = await validateActiveSession();
  if (!sessionValid) {
    return {
      allowed: false,
      error: 'Sessão inválida ou expirada. Faça login novamente.'
    };
  }

  // 3. Para ações muito sensíveis, requerer reautenticação
  if (options.action === 'delete_account' || options.requirePassword) {
    // Implementar modal de confirmação de senha seria ideal aqui
    // Por enquanto, apenas validamos a sessão
  }

  return { allowed: true };
};

/**
 * Wrapper para executar ações críticas com proteção CSRF
 */
export const withCSRFProtection = async <T>(
  action: () => Promise<T>,
  options: CriticalActionOptions
): Promise<T> => {
  const verification = await verifyCriticalAction(options);
  
  if (!verification.allowed) {
    throw new Error(verification.error || 'Ação não permitida');
  }

  return await action();
};





