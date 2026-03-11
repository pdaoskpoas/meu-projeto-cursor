import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  plan_purchased_at: string | null;
  is_annual_plan: boolean | null;
}

export interface SubscriptionFollowup {
  id: string;
  user_id: string;
  admin_id: string | null;
  outreach_status: string;
  contact_channel: string | null;
  contact_notes: string | null;
  cancellation_reason: string | null;
  feedback: string | null;
  contacted_at: string | null;
  responded_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  admin_name?: string | null;
}

export interface FollowupsByUser {
  [userId: string]: SubscriptionFollowup[];
}

export interface CreateFollowupInput {
  userId: string;
  outreachStatus: string;
  contactChannel?: string | null;
  contactNotes?: string | null;
  cancellationReason?: string | null;
  feedback?: string | null;
  contactedAt?: string | null;
  respondedAt?: string | null;
  nextFollowUpAt?: string | null;
}

export interface UpdateFollowupInput {
  outreachStatus?: string;
  contactChannel?: string | null;
  contactNotes?: string | null;
  cancellationReason?: string | null;
  feedback?: string | null;
  contactedAt?: string | null;
  respondedAt?: string | null;
  nextFollowUpAt?: string | null;
}

export const useAdminSubscriptionControl = (expiringDays: number) => {
  const { user } = useAuth();
  const [expiringUsers, setExpiringUsers] = useState<SubscriptionUser[]>([]);
  const [expiredUsers, setExpiredUsers] = useState<SubscriptionUser[]>([]);
  const [followupsByUser, setFollowupsByUser] = useState<FollowupsByUser>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const expiringRange = useMemo(() => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + expiringDays);
    return { nowIso: now.toISOString(), futureIso: future.toISOString() };
  }, [expiringDays]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profilesQuery = 'id, name, email, plan, plan_expires_at, plan_purchased_at, is_annual_plan';
      const profilesQueryWithPhone = `${profilesQuery}, phone`;

      const expiringPromise = supabase
        .from('profiles')
        .select(profilesQueryWithPhone)
        .not('plan_purchased_at', 'is', null)
        .not('plan_expires_at', 'is', null)
        .gte('plan_expires_at', expiringRange.nowIso)
        .lte('plan_expires_at', expiringRange.futureIso)
        .order('plan_expires_at', { ascending: true });

      const expiredPromise = supabase
        .from('profiles')
        .select(profilesQueryWithPhone)
        .not('plan_purchased_at', 'is', null)
        .or(`plan.eq.free,plan_expires_at.lt.${expiringRange.nowIso}`)
        .order('plan_expires_at', { ascending: false });

      const [{ data: expiringData, error: expiringError }, { data: expiredData, error: expiredError }] =
        await Promise.all([expiringPromise, expiredPromise]);

      if (expiringError) throw expiringError;
      if (expiredError) throw expiredError;

      const mappedExpiring = (expiringData || []) as SubscriptionUser[];
      const mappedExpired = (expiredData || []) as SubscriptionUser[];

      setExpiringUsers(mappedExpiring);
      setExpiredUsers(mappedExpired);

      const allUserIds = Array.from(
        new Set([...mappedExpiring, ...mappedExpired].map((profile) => profile.id))
      );

      if (allUserIds.length === 0) {
        setFollowupsByUser({});
        return;
      }

      const { data: followupsData, error: followupsError } = await supabase
        .from('admin_subscription_followups')
        .select(`
          id,
          user_id,
          admin_id,
          outreach_status,
          contact_channel,
          contact_notes,
          cancellation_reason,
          feedback,
          contacted_at,
          responded_at,
          next_follow_up_at,
          created_at,
          admin:profiles!admin_id(name)
        `)
        .in('user_id', allUserIds)
        .order('created_at', { ascending: false });

      if (followupsError) throw followupsError;

      const grouped: FollowupsByUser = {};
      (followupsData || []).forEach((followup: SubscriptionFollowup & { admin?: { name?: string | null } }) => {
        const userId = followup.user_id;
        if (!grouped[userId]) grouped[userId] = [];
        grouped[userId].push({
          ...followup,
          admin_name: followup.admin?.name ?? null
        });
      });
      setFollowupsByUser(grouped);
    } catch (err) {
      console.error('Error fetching subscription control data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [expiringRange.futureIso, expiringRange.nowIso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createFollowup = async (payload: CreateFollowupInput) => {
    if (!user?.id) throw new Error('Usuário administrador não encontrado.');

    const { error: insertError } = await supabase
      .from('admin_subscription_followups')
      .insert({
        user_id: payload.userId,
        admin_id: user.id,
        outreach_status: payload.outreachStatus,
        contact_channel: payload.contactChannel,
        contact_notes: payload.contactNotes,
        cancellation_reason: payload.cancellationReason,
        feedback: payload.feedback,
        contacted_at: payload.contactedAt,
        responded_at: payload.respondedAt,
        next_follow_up_at: payload.nextFollowUpAt
      });

    if (insertError) throw insertError;
    await fetchData();
  };

  const updateFollowup = async (followupId: string, updates: UpdateFollowupInput) => {
    const { error: updateError } = await supabase
      .from('admin_subscription_followups')
      .update({
        outreach_status: updates.outreachStatus,
        contact_channel: updates.contactChannel,
        contact_notes: updates.contactNotes,
        cancellation_reason: updates.cancellationReason,
        feedback: updates.feedback,
        contacted_at: updates.contactedAt,
        responded_at: updates.respondedAt,
        next_follow_up_at: updates.nextFollowUpAt
      })
      .eq('id', followupId);

    if (updateError) throw updateError;
    await fetchData();
  };

  return {
    expiringUsers,
    expiredUsers,
    followupsByUser,
    isLoading,
    error,
    refetch: fetchData,
    createFollowup,
    updateFollowup
  };
};
