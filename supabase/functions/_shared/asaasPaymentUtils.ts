/* eslint-disable @typescript-eslint/no-explicit-any */

// =================================================================
// RATE LIMITING - usa check_rate_limit() do banco
// =================================================================
export const checkRateLimit = async (
  serviceClient: any,
  userId: string,
  operation: string,
  maxAttempts = 5,
  windowMinutes = 10
): Promise<{ allowed: boolean; message?: string }> => {
  const { data, error } = await serviceClient.rpc('check_rate_limit', {
    identifier: userId,
    operation,
    max_attempts: maxAttempts,
    window_minutes: windowMinutes,
  });

  if (error) {
    console.error('[rate-limit] Erro ao verificar rate limit:', error.message);
    // Em caso de erro na verificação, permitir (fail-open para não bloquear pagamentos legítimos)
    return { allowed: true };
  }

  return {
    allowed: data?.allowed ?? true,
    message: data?.message ?? undefined,
  };
};

export const mapPaymentStatus = (status?: string) => {
  const normalized = status?.toUpperCase() ?? '';
  if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(normalized)) return 'APPROVED';
  if (['REJECTED', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'CANCELED'].includes(normalized)) {
    return 'REJECTED';
  }
  return 'PENDING';
};

export const mapSubscriptionStatus = (status?: string) => {
  const normalized = status?.toUpperCase() ?? '';
  if (['ACTIVE'].includes(normalized)) return 'APPROVED';
  if (['CANCELLED', 'CANCELED', 'INACTIVE', 'DELETED'].includes(normalized)) return 'REJECTED';
  return 'PENDING';
};

const ensureTransaction = async (
  serviceClient: any,
  paymentRow: Record<string, any>,
  paymentId: string
) => {
  const { data: existingTransaction } = await serviceClient
    .from('transactions')
    .select('id')
    .eq('asaas_payment_id', paymentId)
    .maybeSingle();

  if (existingTransaction) return;

  const baseTransaction = {
    user_id: paymentRow.user_id,
    asaas_payment_id: paymentId,
    asaas_customer_id: paymentRow.asaas_customer_id,
    billing_type: paymentRow.billing_type,
    amount: paymentRow.value,
    currency: 'BRL',
    status: 'completed',
    metadata: {
      payment_type: paymentRow.payment_type,
      description: paymentRow.description,
    },
  } as Record<string, unknown>;

  if (paymentRow.payment_type === 'subscription') {
    const { data: subscriptionRow } = await serviceClient
      .from('asaas_subscriptions')
      .select('plan_type, billing_type, asaas_subscription_id')
      .eq('id', paymentRow.subscription_id)
      .maybeSingle();

    await serviceClient.from('transactions').insert({
      ...baseTransaction,
      type: 'plan_subscription',
      plan_type: subscriptionRow?.plan_type ?? null,
      is_annual: subscriptionRow?.billing_type
        ? subscriptionRow.billing_type !== 'monthly'
        : null,
      asaas_subscription_id: subscriptionRow?.asaas_subscription_id ?? null,
    });
    return;
  }

  if (paymentRow.payment_type === 'boost_purchase') {
    const boostQuantity = (paymentRow.metadata as { boost_quantity?: number })?.boost_quantity ?? 1;
    await serviceClient.from('transactions').insert({
      ...baseTransaction,
      type: 'boost_purchase',
      boost_quantity: boostQuantity,
    });
    return;
  }

  await serviceClient.from('transactions').insert({
    ...baseTransaction,
    type: 'individual_ad',
    metadata: {
      ...(baseTransaction.metadata as Record<string, unknown>),
      related_content_type: paymentRow.related_content_type,
      related_content_id: paymentRow.related_content_id,
    },
  });
};

export const applyApprovedPaymentEffects = async (
  serviceClient: any,
  paymentRow: Record<string, any>,
  paymentId: string
) => {
  let pendingBoostGrant:
    | {
        userId: string;
        quantity: number;
        metadata: Record<string, unknown>;
        profileBefore: {
          plan_boost_credits?: number | null;
          purchased_boost_credits?: number | null;
          available_boosts?: number | null;
        };
      }
    | null = null;
  const syncAvailableBoosts = async (
    userId: string,
    planCredits: number,
    purchasedCredits: number,
    currentAvailable: number | null | undefined
  ) => {
    const nextAvailable = planCredits + purchasedCredits;
    if ((currentAvailable ?? 0) !== nextAvailable) {
      const { error: syncError } = await serviceClient
        .from('profiles')
        .update({ available_boosts: nextAvailable })
        .eq('id', userId);

      if (syncError) {
        throw new Error('Pagamento confirmado, mas não foi possível sincronizar seus créditos.');
      }
    }
  };

  if (paymentRow.payment_type === 'subscription' && paymentRow.subscription_id) {
    await serviceClient
      .from('asaas_subscriptions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        first_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRow.subscription_id);

    const { data: subscriptionRow } = await serviceClient
      .from('asaas_subscriptions')
      .select('plan_type, billing_type, expires_at, started_at')
      .eq('id', paymentRow.subscription_id)
      .maybeSingle();

    if (subscriptionRow?.plan_type) {
      const { data: profileRow } = await serviceClient
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', paymentRow.user_id)
        .maybeSingle();

      const needsProfileUpdate =
        profileRow?.plan !== subscriptionRow.plan_type ||
        (subscriptionRow.expires_at &&
          profileRow?.plan_expires_at !== subscriptionRow.expires_at);

      if (needsProfileUpdate) {
        await serviceClient
          .from('profiles')
          .update({
            plan: subscriptionRow.plan_type,
            plan_expires_at: subscriptionRow.expires_at ?? null,
            plan_purchased_at: subscriptionRow.started_at ?? new Date().toISOString(),
            is_annual_plan: subscriptionRow.billing_type === 'annual',
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRow.user_id);
      }
    }
  }

  if (paymentRow.payment_type === 'individual_ad' && paymentRow.related_content_id) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await serviceClient
      .from('animals')
      .update({
        is_individual_paid: true,
        individual_paid_expires_at: expiresAt.toISOString(),
        ad_status: 'active',
        published_at: new Date().toISOString(),
      })
      .eq('id', paymentRow.related_content_id);
  }

  if (paymentRow.payment_type === 'individual_event' && paymentRow.related_content_id) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await serviceClient
      .from('events')
      .update({
        is_individual_paid: true,
        individual_paid_expires_at: expiresAt.toISOString(),
        ad_status: 'active',
        published_at: new Date().toISOString(),
      })
      .eq('id', paymentRow.related_content_id);
  }

  if (paymentRow.payment_type === 'boost_purchase') {
    const metadata = (paymentRow.metadata ?? {}) as Record<string, unknown>;
    const boostsGranted = Boolean(metadata.boosts_granted);
    // Compatível com modelo antigo (boost_quantity) e novo (boost_duration → sempre 1 crédito)
    const boostQuantity = (metadata.boost_quantity as number | undefined) ?? 1;

    if (!boostsGranted) {
      const { data: profileBefore, error: profileError } = await serviceClient
        .from('profiles')
        .select('plan_boost_credits, purchased_boost_credits, available_boosts')
        .eq('id', paymentRow.user_id)
        .single();

      if (profileError || !profileBefore) {
        throw new Error('Pagamento confirmado, mas não foi possível buscar seus créditos.');
      }

      pendingBoostGrant = {
        userId: paymentRow.user_id,
        quantity: boostQuantity,
        metadata,
        profileBefore,
      };
    }
  }

  await ensureTransaction(serviceClient, paymentRow, paymentId);

  if (pendingBoostGrant) {
    const { data: profileAfter, error: profileAfterError } = await serviceClient
      .from('profiles')
      .select('plan_boost_credits, purchased_boost_credits, available_boosts')
      .eq('id', pendingBoostGrant.userId)
      .single();

    if (profileAfterError || !profileAfter) {
      throw new Error('Pagamento confirmado, mas não foi possível atualizar seus créditos.');
    }

    const beforePurchased = pendingBoostGrant.profileBefore.purchased_boost_credits ?? 0;
    const afterPurchased = profileAfter.purchased_boost_credits ?? 0;
    const alreadyAdded = Math.max(0, afterPurchased - beforePurchased);
    const remaining = pendingBoostGrant.quantity - alreadyAdded;
    const planCredits = profileAfter.plan_boost_credits ?? 0;

    if (remaining > 0) {
      const nextPurchased = afterPurchased + remaining;
      const nextAvailable = planCredits + nextPurchased;
      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({
          purchased_boost_credits: nextPurchased,
          available_boosts: nextAvailable,
        })
        .eq('id', pendingBoostGrant.userId);

      if (updateError) {
        throw new Error('Pagamento confirmado, mas não foi possível atualizar seus créditos.');
      }
    } else {
      await syncAvailableBoosts(
        pendingBoostGrant.userId,
        planCredits,
        afterPurchased,
        profileAfter.available_boosts
      );
    }

    await serviceClient
      .from('asaas_payments')
      .update({
        metadata: {
          ...pendingBoostGrant.metadata,
          boosts_granted: true,
          boosts_granted_at: new Date().toISOString(),
        },
      })
      .eq('asaas_payment_id', paymentId);
  } else if (paymentRow.payment_type === 'boost_purchase') {
    const { data: profileSnapshot, error: profileSnapshotError } = await serviceClient
      .from('profiles')
      .select('plan_boost_credits, purchased_boost_credits, available_boosts')
      .eq('id', paymentRow.user_id)
      .single();

    if (profileSnapshotError || !profileSnapshot) {
      throw new Error('Pagamento confirmado, mas não foi possível sincronizar seus créditos.');
    }

    await syncAvailableBoosts(
      paymentRow.user_id,
      profileSnapshot.plan_boost_credits ?? 0,
      profileSnapshot.purchased_boost_credits ?? 0,
      profileSnapshot.available_boosts
    );
  }
};
