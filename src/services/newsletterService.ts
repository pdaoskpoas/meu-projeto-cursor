import { supabase } from '@/lib/supabase';

export interface NewsletterSubscription {
  id: string;
  email: string;
  source: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export const newsletterService = {
  async subscribe(email: string, source = 'site_home') {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, message: 'Informe um e-mail valido.' };
    }

    const { error } = await supabase.from('newsletter_subscriptions').insert({
      email: normalizedEmail,
      source,
      metadata: {
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      },
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Este e-mail ja esta cadastrado na newsletter.' };
      }
      return { success: false, message: 'Nao foi possivel cadastrar o e-mail agora.' };
    }

    return { success: true, message: 'E-mail cadastrado com sucesso!' };
  },

  async listLatest(limit = 200) {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, source, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message || 'Erro ao carregar inscritos da newsletter.');
    }

    return (data || []) as NewsletterSubscription[];
  },
};
