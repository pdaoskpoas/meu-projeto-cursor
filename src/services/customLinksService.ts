import { supabase } from '@/lib/supabase';

export interface CustomLink {
  id: string;
  user_id: string;
  position: number;
  label: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  view_count: number;
  click_count: number;
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

// ─── Session helper (reutiliza o mesmo padrão do pageVisitService) ───
function getSessionId(): string {
  const key = 'analytics_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// ─── Leitura ─────────────────────────────────────────────

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

// ─── Escrita ─────────────────────────────────────────────

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

// ─── Tracking ────────────────────────────────────────────

/**
 * Registra uma impressão (view) em um botão.
 * Chamado quando os botões aparecem na tela do visitante.
 */
export async function recordLinkView(linkId: string): Promise<void> {
  try {
    await supabase.rpc('increment_link_view_count', { link_id: linkId });
  } catch {
    // Fallback: incrementar diretamente
    // Se a RPC não existir, faz update manual
    const { data } = await supabase
      .from('haras_custom_links')
      .select('view_count')
      .eq('id', linkId)
      .single();

    if (data) {
      await supabase
        .from('haras_custom_links')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', linkId);
    }
  }
}

/**
 * Registra impressões em batch (todos os botões visíveis de uma vez).
 */
export async function recordLinkViews(links: CustomLink[]): Promise<void> {
  // Incrementar view_count de cada link
  await Promise.allSettled(
    links.map(async (link) => {
      await supabase
        .from('haras_custom_links')
        .update({ view_count: (link.view_count || 0) + 1 })
        .eq('id', link.id);
    })
  );
}

/**
 * Registra um clique em um botão da vitrine.
 * Chamado quando o visitante clica no botão.
 */
export async function recordLinkClick(link: CustomLink): Promise<void> {
  const sessionId = getSessionId();

  try {
    // 1. Inserir na tabela de cliques detalhada
    await supabase.from('vitrine_link_clicks').insert({
      link_id: link.id,
      user_id: link.user_id,
      session_id: sessionId,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    // 2. Incrementar contador no link
    await supabase
      .from('haras_custom_links')
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq('id', link.id);
  } catch (error) {
    console.error('[customLinksService] Erro ao registrar clique:', error);
  }
}

// ─── Estatísticas ────────────────────────────────────────

/**
 * Estatísticas gerais da vitrine (visitas à página).
 */
export async function getVitrineStats(userId: string): Promise<{
  totalVisits: number;
  totalClicks: number;
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
      return { totalVisits: 0, totalClicks: 0, last30DaysVisits: 0 };
    }

    const vitrinePath = `/u/${profile.public_code}`;

    // Visitas à página
    const { data: allVisits } = await supabase
      .from('page_visits')
      .select('id, created_at')
      .eq('page_key', 'vitrine')
      .eq('page_path', vitrinePath);

    const visits = allVisits || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysVisits = visits.filter(
      (v) => new Date(v.created_at || '') >= thirtyDaysAgo
    ).length;

    // Total de cliques em todos os botões
    const { data: clickData } = await supabase
      .from('vitrine_link_clicks')
      .select('id')
      .eq('user_id', userId);

    const totalClicks = clickData?.length || 0;

    return {
      totalVisits: visits.length,
      totalClicks,
      last30DaysVisits,
    };
  } catch {
    return { totalVisits: 0, totalClicks: 0, last30DaysVisits: 0 };
  }
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Monta URL de WhatsApp a partir do número.
 */
export function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}
