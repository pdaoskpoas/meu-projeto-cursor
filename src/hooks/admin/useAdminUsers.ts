import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeNameForStorage } from '@/utils/nameFormat';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  accountType: 'personal' | 'institutional';
  propertyName?: string;
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao';
  plan: 'free' | 'basic' | 'pro' | 'ultra' | 'vip';
  planExpiresAt?: string;
  planPurchasedAt?: string;
  isAnnualPlan?: boolean;
  createdAt: string;
  isActive: boolean;
  isSuspended: boolean;
  role?: 'user' | 'admin';
  availableBoosts?: number;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedUsers: AdminUser[] = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name || 'Sem nome',
        email: profile.email,
        phone: profile.phone,
        cpf: profile.cpf,
        accountType: profile.account_type || 'personal',
        propertyName: profile.property_name,
        propertyType: profile.property_type,
        plan: profile.plan || 'free',
        planExpiresAt: profile.plan_expires_at,
        planPurchasedAt: profile.plan_purchased_at,
        isAnnualPlan: profile.is_annual_plan,
        createdAt: profile.created_at,
        isActive: profile.is_active !== false,
        isSuspended: profile.is_suspended === true,
        role: profile.role || 'user',
        availableBoosts: profile.available_boosts || 0,
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (userId: string, updates: Partial<AdminUser>) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          cpf: updates.cpf,
          account_type: updates.accountType,
          property_name: normalizeNameForStorage(updates.propertyName),
          property_type: updates.propertyType,
          plan: updates.plan,
          plan_expires_at: updates.planExpiresAt,
          plan_purchased_at: updates.planPurchasedAt,
          is_annual_plan: updates.isAnnualPlan,
          is_active: updates.isActive,
          is_suspended: updates.isSuspended,
          role: updates.role,
          available_boosts: updates.availableBoosts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Refetch data
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const suspendUser = async (userId: string, reason: string) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Get user data
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, cpf')
        .eq('id', userId)
        .single();

      // Add to suspensions table
      const { error: suspensionError } = await supabase
        .from('suspensions')
        .insert({
          user_id: userId,
          email: userData?.email,
          cpf: userData?.cpf,
          reason,
          suspended_at: new Date().toISOString(),
          is_active: true,
        });

      if (suspensionError) throw suspensionError;

      // Refetch data
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error suspending user:', err);
      throw err;
    }
  };

  const unsuspendUser = async (userId: string) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Deactivate suspension record
      const { error: suspensionError } = await supabase
        .from('suspensions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (suspensionError) throw suspensionError;

      // Refetch data
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error unsuspending user:', err);
      throw err;
    }
  };

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
    updateUser,
    suspendUser,
    unsuspendUser,
  };
};




