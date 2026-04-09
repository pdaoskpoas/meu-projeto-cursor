import { supabase } from '@/lib/supabase';

export interface CustomLink {
  id: string;
  user_id: string;
  position: number;
  label: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomLinkInput {
  position: number;
  label: string;
  url: string;
  icon?: string | null;
  is_active: boolean;
}

/**
 * Busca links públicos ativos de um usuário (para a página /u/:slug).
 */
export async function getPublicLinks(userId: string): Promise<CustomLink[]> {
  const { data, error } = await supabase
    .from('haras_custom_links')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    console.error('[customLinksService] Erro ao buscar links públicos:', error);
    return [];
  }

  return (data as CustomLink[]) || [];
}

/**
 * Busca TODOS os links do usuário logado (incluindo inativos).
 */
export async function getMyLinks(userId: string): Promise<CustomLink[]> {
  const { data, error } = await supabase
    .from('haras_custom_links')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) {
    console.error('[customLinksService] Erro ao buscar meus links:', error);
    return [];
  }

  return (data as CustomLink[]) || [];
}

/**
 * Salva (upsert) um link em uma posição específica.
 */
export async function saveLink(userId: string, link: CustomLinkInput): Promise<boolean> {
  const { error } = await supabase
    .from('haras_custom_links')
    .upsert(
      {
        user_id: userId,
        position: link.position,
        label: link.label,
        url: link.url,
        icon: link.icon || null,
        is_active: link.is_active,
      },
      { onConflict: 'user_id,position' }
    );

  if (error) {
    console.error('[customLinksService] Erro ao salvar link:', error);
    return false;
  }

  return true;
}

/**
 * Salva todos os links de uma vez (batch upsert).
 */
export async function saveAllLinks(userId: string, links: CustomLinkInput[]): Promise<boolean> {
  const rows = links.map((link) => ({
    user_id: userId,
    position: link.position,
    label: link.label,
    url: link.url,
    icon: link.icon || null,
    is_active: link.is_active,
  }));

  const { error } = await supabase
    .from('haras_custom_links')
    .upsert(rows, { onConflict: 'user_id,position' });

  if (error) {
    console.error('[customLinksService] Erro ao salvar links:', error);
    return false;
  }

  return true;
}

/**
 * Conta visitas à página /u/ de um usuário específico.
 * Usa a tabela page_visits com page_key = 'vitrine'.
 */
export async function getVitrineStats(userId: string): Promise<{
  totalVisits: number;
  uniqueSessions: number;
  last30DaysVisits: number;
}> {
  try {
    // Buscar o public_code do usuário para montar o path
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('public_code')
      .eq('id', userId)
      .single();

    if (!profile?.public_code) {
      return { totalVisits: 0, uniqueSessions: 0, last30DaysVisits: 0 };
    }

    const vitrinePath = `/u/${profile.public_code}`;

    // Total de visitas
    const { data: allVisits, error } = await supabase
      .from('page_visits')
      .select('id, session_id, created_at')
      .eq('page_key', 'vitrine')
      .eq('page_path', vitrinePath);

    if (error) {
      console.error('[customLinksService] Erro ao buscar stats:', error);
      return { totalVisits: 0, uniqueSessions: 0, last30DaysVisits: 0 };
    }

    const visits = allVisits || [];
    const uniqueSessions = new Set(visits.map((v) => v.session_id)).size;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysVisits = visits.filter(
      (v) => new Date(v.created_at || '') >= thirtyDaysAgo
    ).length;

    return {
      totalVisits: visits.length,
      uniqueSessions,
      last30DaysVisits,
    };
  } catch {
    return { totalVisits: 0, uniqueSessions: 0, last30DaysVisits: 0 };
  }
}

/**
 * Monta URL de WhatsApp a partir do número.
 */
export function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}
