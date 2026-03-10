/**
 * 🛡️ Hook de Validação Admin Segura
 * 
 * Valida role admin no BACKEND (não apenas frontend)
 * Protege contra bypass de verificação client-side
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminValidationResult {
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  userId: string | null;
  userEmail: string | null;
}

export const useSecureAdminValidation = () => {
  const [validation, setValidation] = useState<AdminValidationResult>({
    isAdmin: false,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    userId: null,
    userEmail: null
  });

  useEffect(() => {
    validateAdminAccess();
  }, []);

  const validateAdminAccess = async () => {
    try {
      setValidation(prev => ({ ...prev, isLoading: true, error: null }));

      // 🔒 Validação no BACKEND via função protegida
      const { data, error } = await supabase
        .rpc('validate_admin_access');

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Validation failed');
      }

      setValidation({
        isAdmin: data.is_admin || false,
        isLoading: false,
        isAuthenticated: data.authenticated || false,
        error: data.is_admin ? null : 'Access denied: Admin role required',
        userId: data.user_id || null,
        userEmail: data.user_email || null
      });

      // 🔒 Log de tentativa de acesso (já registrado no backend)
      if (!data.is_admin) {
        console.warn('⚠️ Unauthorized admin access attempt detected');
      }

    } catch (error) {
      console.error('Admin validation error:', error);
      
      setValidation({
        isAdmin: false,
        isLoading: false,
        isAuthenticated: false,
        error: 'Validation failed - please try again',
        userId: null,
        userEmail: null
      });
    }
  };

  return {
    ...validation,
    revalidate: validateAdminAccess
  };
};

/**
 * Hook simples para apenas checar se é admin (com cache)
 */
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useSecureAdminValidation();
  return isAdmin;
};

/**
 * Higher-Order Component para proteger componentes
 * Função comentada pois não está sendo utilizada no momento
 */
/*
export function withAdminValidation(
  Component: React.ComponentType<any>,
  FallbackComponent?: React.ComponentType
): React.FC<any> {
  const WrappedComponent: React.FC<any> = (props: any) => {
    const { isAdmin, isLoading } = useSecureAdminValidation();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-medium">Validating admin access...</p>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access this page.</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
  
  return WrappedComponent;
}
*/


