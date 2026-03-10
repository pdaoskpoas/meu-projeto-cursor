// Hook para gerenciar planos (dados REAIS do Supabase)
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  max_animals?: number;
  max_events?: number;
  available_boosts: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanInsert {
  name: string;
  display_name: string;
  description?: string;
  price: number;
  duration: number;
  features: string[];
  max_animals?: number;
  max_events?: number;
  available_boosts?: number;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
}

export interface PlanUpdate {
  display_name?: string;
  description?: string;
  price?: number;
  duration?: number;
  features?: string[];
  max_animals?: number;
  max_events?: number;
  available_boosts?: number;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
}

export const useAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      const mappedPlans: Plan[] = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        display_name: plan.display_name,
        description: plan.description,
        price: parseFloat(plan.price),
        currency: plan.currency || 'BRL',
        duration: plan.duration,
        features: plan.features || [],
        max_animals: plan.max_animals,
        max_events: plan.max_events,
        available_boosts: plan.available_boosts || 0,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        display_order: plan.display_order,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
      }));

      setPlans(mappedPlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createPlan = async (planData: PlanInsert): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('plans')
        .insert({
          name: planData.name,
          display_name: planData.display_name,
          description: planData.description,
          price: planData.price,
          duration: planData.duration,
          features: planData.features,
          max_animals: planData.max_animals,
          max_events: planData.max_events,
          available_boosts: planData.available_boosts || 0,
          is_active: planData.is_active !== undefined ? planData.is_active : true,
          is_featured: planData.is_featured || false,
          display_order: planData.display_order || 999,
        });

      if (insertError) throw insertError;

      await fetchPlans();
      return true;
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };

  const updatePlan = async (planId: string, updates: PlanUpdate): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.features !== undefined) updateData.features = updates.features;
      if (updates.max_animals !== undefined) updateData.max_animals = updates.max_animals;
      if (updates.max_events !== undefined) updateData.max_events = updates.max_events;
      if (updates.available_boosts !== undefined) updateData.available_boosts = updates.available_boosts;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.is_featured !== undefined) updateData.is_featured = updates.is_featured;
      if (updates.display_order !== undefined) updateData.display_order = updates.display_order;

      const { error: updateError } = await supabase
        .from('plans')
        .update(updateData)
        .eq('id', planId);

      if (updateError) throw updateError;

      await fetchPlans();
      return true;
    } catch (err) {
      console.error('Error updating plan:', err);
      throw err;
    }
  };

  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (deleteError) throw deleteError;

      await fetchPlans();
      return true;
    } catch (err) {
      console.error('Error deleting plan:', err);
      throw err;
    }
  };

  const togglePlanStatus = async (planId: string): Promise<boolean> => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      return await updatePlan(planId, { is_active: !plan.is_active });
    } catch (err) {
      console.error('Error toggling plan status:', err);
      throw err;
    }
  };

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
  };
};


