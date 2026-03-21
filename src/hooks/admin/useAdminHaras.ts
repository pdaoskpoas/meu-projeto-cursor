import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminHarasProfile {
  id: string;
  name: string;
  email: string;
  propertyName?: string;
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao';
  city?: string;
  state?: string;
  phone?: string;
  plan: 'free' | 'essencial' | 'criador' | 'haras' | 'elite' | 'vip' | 'basic' | 'pro' | 'ultra';
  planExpiresAt?: string;
  isActive: boolean;
  isSuspended: boolean;
  totalAnimals: number;
  activeAnimals: number;
  createdAt: string;
}

export const useAdminHaras = () => {
  const [profiles, setProfiles] = useState<AdminHarasProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar perfis institucionais
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'institutional')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Para cada perfil, buscar contagem de animais
      const profilesWithCounts = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Total de animais do haras
          const { count: totalAnimals } = await supabase
            .from('animals')
            .select('*', { count: 'exact', head: true })
            .eq('haras_id', profile.id);

          // Animais ativos do haras
          const { count: activeAnimals } = await supabase
            .from('animals')
            .select('*', { count: 'exact', head: true })
            .eq('haras_id', profile.id)
            .eq('ad_status', 'active');

          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            propertyName: profile.property_name,
            propertyType: profile.property_type,
            city: profile.current_city,
            state: profile.current_state,
            phone: profile.phone,
            plan: profile.plan || 'free',
            planExpiresAt: profile.plan_expires_at,
            isActive: profile.is_active !== false,
            isSuspended: profile.is_suspended === true,
            totalAnimals: totalAnimals || 0,
            activeAnimals: activeAnimals || 0,
            createdAt: profile.created_at,
          };
        })
      );

      setProfiles(profilesWithCounts);
    } catch (err) {
      console.error('Error fetching admin haras profiles:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    isLoading,
    error,
    refetch: fetchProfiles,
  };
};




