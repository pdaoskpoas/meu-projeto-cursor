/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import type { Profile } from '@/types/supabase';
import { formatNameUppercase } from '@/utils/nameFormat';

interface User {
  id: string;
  name: string;
  email: string;
  accountType: 'personal' | 'institutional';
  propertyName?: string;
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao';
  propertyId?: string;
  publicCode?: string;
  plan?: Profile['plan'];
  planExpiresAt?: string | null;
  planPurchasedAt?: string | null;
  isAnnualPlan?: boolean;
  hasActivePlan?: boolean;
  role?: 'admin';
  avatar?: string;
  institutionLogo?: string;
  cpf?: string;
  isSuspended?: boolean;
  suspensionDate?: string;
  suspensionReason?: string;
  availableBoosts?: number; // Impulsionamentos disponíveis
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  refreshUser: () => Promise<User | null>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  accountType: 'personal' | 'institutional';
  propertyName?: string;
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao';
  cpf: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapProfileToUser = (profile: Profile): User => {
  const plan = profile.plan ?? 'free';
  const planExpiresAt = profile.plan_expires_at;
  const hasActivePlan =
    plan !== 'free' &&
    (!planExpiresAt || new Date(planExpiresAt).getTime() > Date.now());

  const propertyName = profile.account_type === 'institutional'
    ? formatNameUppercase(profile.property_name ?? undefined)
    : profile.property_name ?? undefined;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    accountType: profile.account_type,
    propertyName,
    propertyType: profile.property_type ?? undefined,
    propertyId: profile.property_id ?? undefined,
    publicCode: profile.public_code ?? undefined,
    plan,
    planExpiresAt,
    planPurchasedAt: profile.plan_purchased_at ?? undefined,
    isAnnualPlan: profile.is_annual_plan ?? undefined,
    hasActivePlan,
    role: profile.role === 'admin' ? 'admin' : undefined,
    avatar: profile.avatar_url ?? undefined,
    cpf: profile.cpf ?? undefined,
    isSuspended: profile.is_suspended ?? undefined,
    availableBoosts: profile.available_boosts ?? undefined
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let cancelled = false;

    const schedule = (cb: () => void) => {
      if ('requestIdleCallback' in window) {
        return (window as Window & { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number })
          .requestIdleCallback?.(cb, { timeout: 2000 });
      }
      return window.setTimeout(cb, 300);
    };

    const init = async () => {
      setIsLoading(true);
      try {
        // Recupera sessão atual
        try {
          const current = await authService.getCurrentUser();
          if (cancelled) return;
          if (current?.profile) {
            setUser(mapProfileToUser(current.profile));
          } else {
            setUser(null);
          }
        } catch (error) {
          console.warn('[AuthContext] Falha temporária ao reidratar usuário. Mantendo estado atual.', error);
        }

        if (cancelled) return;

        // Listener de mudanças de sessão
        unsub = await authService.onAuthStateChange(async (authUser) => {
          if (authUser?.profile) {
            setUser(mapProfileToUser(authUser.profile));
          } else {
            setUser(null);
          }
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const id = schedule(() => {
      void init();
    });

    return () => {
      cancelled = true;
      if (typeof id === 'number') {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
        } else {
          clearTimeout(id);
        }
      }
      try {
        unsub?.data.subscription.unsubscribe();
      } catch (error) {
        // Ignorar erros ao desinscrever - componente está desmontando
        console.debug('Error unsubscribing:', error);
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      const authUser = await authService.login({ email, password });
      if (authUser?.profile) {
        const mappedUser = mapProfileToUser(authUser.profile);
        setUser(mappedUser);
        return mappedUser;
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout().finally(() => {
      setUser(null);
      // 🔒 Não usar localStorage para dados sensíveis - Supabase Auth gerencia sessão
    });
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const created = await authService.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        cpf: userData.cpf,
        phone: userData.phone,
        accountType: userData.accountType,
        propertyName: userData.propertyName,
        propertyType: userData.propertyType
      });

      if (created?.profile) {
        setUser(mapProfileToUser(created.profile));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      const refreshed = await authService.getCurrentUser();
      if (refreshed?.profile) {
        const mappedUser = mapProfileToUser(refreshed.profile);
        setUser(mappedUser);
        return mappedUser;
      }
      return null;
    } catch (error) {
      console.warn('[AuthContext] Falha temporária ao atualizar usuário. Mantendo estado atual.', error);
      return user;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};