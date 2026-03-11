import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ensureActiveSession } from '@/services/sessionService';

/**
 * Mantém a sessão autenticada saudável durante navegação longa.
 * Não faz logout por inatividade no frontend; apenas revalida a sessão
 * periodicamente e quando a aba volta a ficar visível.
 */

const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 60 * 1000;

export const useSessionTimeout = () => {
  const { user } = useAuth();
  const intervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const lastActivityRefreshRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshSession = useCallback(async (forceRefresh = false) => {
    if (!user || isRefreshingRef.current) return;

    isRefreshingRef.current = true;

    try {
      await ensureActiveSession({
        forceRefresh,
        timeoutMs: forceRefresh ? 8000 : 5000
      });
    } catch (error) {
      console.error('[SessionTimeout] Erro ao manter sessão ativa:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user]);

  const resetSessionTimeout = useCallback(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRefreshRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRefreshRef.current = now;
      void refreshSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession(true);
      }
    };

    const handleFocus = () => {
      void refreshSession(true);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    void refreshSession();
    intervalRef.current = window.setInterval(() => {
      void refreshSession();
    }, SESSION_CHECK_INTERVAL_MS);

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimers();
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshSession, clearTimers]);

  return {
    resetTimeout: resetSessionTimeout,
    clearTimeout: clearTimers
  };
};





