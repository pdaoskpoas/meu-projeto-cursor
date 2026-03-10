import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * 🔒 Hook para implementar timeout automático de sessão
 * Baseado em OWASP Session Management Cheat Sheet
 * 
 * Logout automático após 30 minutos de inatividade
 * Reset do timer em qualquer atividade do usuário
 */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME_MS = 2 * 60 * 1000; // 2 minutos antes do logout

export const useSessionTimeout = () => {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownWarning = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    hasShownWarning.current = false;
  }, []);

  const showWarning = useCallback(() => {
    if (!hasShownWarning.current && user) {
      hasShownWarning.current = true;
      toast({
        title: '⏱️ Sessão expirando',
        description: 'Sua sessão irá expirar em 2 minutos por inatividade. Mova o mouse para continuar.',
        duration: 10000
      });
    }
  }, [toast, user]);

  const performLogout = useCallback(() => {
    if (user) {
      logout();
      toast({
        title: 'Sessão expirada',
        description: 'Você foi desconectado por inatividade. Faça login novamente para continuar.',
        variant: 'destructive',
        duration: 7000
      });
    }
  }, [logout, toast, user]);

  const resetSessionTimeout = useCallback(() => {
    clearTimers();

    // Apenas configurar timeout se usuário estiver logado
    if (!user) return;

    // Timer de aviso (28 minutos)
    warningRef.current = setTimeout(showWarning, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

    // Timer de logout (30 minutos)
    timeoutRef.current = setTimeout(performLogout, SESSION_TIMEOUT_MS);
  }, [clearTimers, performLogout, showWarning, user]);

  useEffect(() => {
    // Não ativar se usuário não estiver logado
    if (!user) {
      clearTimers();
      return;
    }

    // Eventos que resetam o timer (atividade do usuário)
    const events = [
      'mousedown',
      'mousemove', 
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle para evitar reset muito frequente
    let lastReset = Date.now();
    const throttleMs = 1000; // Resetar no máximo a cada 1 segundo

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > throttleMs) {
        resetSessionTimeout();
        lastReset = now;
      }
    };

    // Iniciar timeout
    resetSessionTimeout();

    // Adicionar event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      clearTimers();
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetSessionTimeout, clearTimers]); // Reagir quando user mudar (login/logout)

  return {
    resetTimeout: resetSessionTimeout,
    clearTimeout: clearTimers
  };
};





