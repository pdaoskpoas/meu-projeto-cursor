import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Timeout de segurança: se isLoading ficar true por mais tempo que o esperado
 * (ex: promise pendente inesperada), força a saída do estado de carregamento
 * para que o usuário não veja um spinner infinito.
 *
 * O AuthContext já possui timeout de 15s + requestIdleCallback de até 2s.
 * Esse valor cobre todo esse ciclo com margem de segurança.
 */
const AUTH_LOADING_TIMEOUT_MS = 20_000;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  // Safety net: nunca permite isLoading prender a UI infinitamente
  useEffect(() => {
    if (!isLoading) {
      setForceReady(false);
      return;
    }

    const timer = window.setTimeout(() => {
      console.warn(
        '[ProtectedRoute] Auth loading ultrapassou timeout de segurança — forçando saída do estado de carregamento.'
      );
      setForceReady(true);
    }, AUTH_LOADING_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !forceReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
