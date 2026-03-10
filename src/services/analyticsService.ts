import { supabase } from '@/lib/supabase'
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers'
import { newsService } from '@/services/newsService'
import type { ImpressionInsert, ClickInsert } from '@/types/supabase'

export interface AnalyticsData {
  impressions: number
  clicks: number
  clickRate: number
}

export interface ViewportPosition {
  top: number
  left: number
  width: number
  height: number
}

class AnalyticsService {
  private sessionId: string
  private viewedInSession: Set<string> = new Set()

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  // Obter ou criar session ID
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  // Validar UUID
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // Registrar impressão
  async recordImpression(
    contentType: 'animal' | 'event' | 'article',
    contentId: string,
    userId?: string,
    options?: {
      pageUrl?: string
      referrer?: string
      viewportPosition?: ViewportPosition
      carouselName?: string
      carouselPosition?: number
    }
  ): Promise<void> {
    try {
      // Validar contentId - deve ser UUID válido
      if (!contentId || !this.isValidUUID(contentId)) {
        console.warn(`[Analytics] Invalid contentId: ${contentId}. Skipping impression.`)
        return
      }

      const impressionKey = `${contentType}_${contentId}`
      
      // Verificar se já foi registrado nesta sessão
      if (this.viewedInSession.has(impressionKey)) {
        return
      }

      const impressionData: ImpressionInsert = {
        content_type: contentType,
        content_id: contentId,
        user_id: userId || null,
        session_id: this.sessionId,
        page_url: options?.pageUrl || window.location.href,
        referrer: options?.referrer || document.referrer || null,
        viewport_position: options?.viewportPosition || null,
        carousel_name: options?.carouselName || null,
        carousel_position: options?.carouselPosition || null,
        user_agent: navigator.userAgent,
        ip_address: null // Será preenchido pelo servidor
      }

      const { error } = await supabase
        .from('impressions')
        .insert(impressionData)

      if (error) {
        throw handleSupabaseError(error)
      }

      if (contentType === 'article') {
        await newsService.incrementArticleViews(contentId)
      }

      // Marcar como visualizado nesta sessão
      this.viewedInSession.add(impressionKey)

      logSupabaseOperation('Impression recorded', { contentType, contentId })

    } catch (error) {
      logSupabaseOperation('Record impression error', null, error)
      // Não propagar erro para não quebrar a UX
    }
  }

  // Registrar clique
  async recordClick(
    contentType: 'animal' | 'event' | 'article',
    contentId: string,
    userId?: string,
    options?: {
      pageUrl?: string
      referrer?: string
      clickTarget?: string
    }
  ): Promise<void> {
    try {
      // Validar contentId - deve ser UUID válido
      if (!contentId || !this.isValidUUID(contentId)) {
        console.warn(`[Analytics] Invalid contentId: ${contentId}. Skipping click.`)
        return
      }

      const clickData: ClickInsert = {
        content_type: contentType,
        content_id: contentId,
        user_id: userId || null,
        session_id: this.sessionId,
        page_url: options?.pageUrl || window.location.href,
        referrer: options?.referrer || document.referrer || null,
        click_target: options?.clickTarget || null,
        user_agent: navigator.userAgent,
        ip_address: null // Será preenchido pelo servidor
      }

      const { error } = await supabase
        .from('clicks')
        .insert(clickData)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Click recorded', { contentType, contentId })

    } catch (error) {
      logSupabaseOperation('Record click error', null, error)
      // Não propagar erro para não quebrar a UX
    }
  }

  // Obter analytics de um conteúdo específico
  async getContentAnalytics(
    contentType: 'animal' | 'event' | 'article',
    contentId: string
  ): Promise<AnalyticsData> {
    try {
      // Validar contentId
      if (!contentId || !this.isValidUUID(contentId)) {
        console.warn(`[Analytics] Invalid contentId: ${contentId}. Returning zeros.`)
        return { impressions: 0, clicks: 0, clickRate: 0 }
      }

      logSupabaseOperation('Get content analytics', { contentType, contentId })

      // Buscar impressões
      const { data: impressionsData, error: impressionsError } = await supabase
        .from('impressions')
        .select('id')
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      if (impressionsError) {
        throw handleSupabaseError(impressionsError)
      }

      // Buscar cliques
      const { data: clicksData, error: clicksError } = await supabase
        .from('clicks')
        .select('id')
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      if (clicksError) {
        throw handleSupabaseError(clicksError)
      }

      const impressions = impressionsData?.length || 0
      const clicks = clicksData?.length || 0
      const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0

      const analytics: AnalyticsData = {
        impressions,
        clicks,
        clickRate: Math.round(clickRate * 100) / 100
      }

      logSupabaseOperation('Get content analytics success', analytics)
      return analytics

    } catch (error) {
      logSupabaseOperation('Get content analytics error', null, error)
      return { impressions: 0, clicks: 0, clickRate: 0 }
    }
  }

  // Obter analytics do usuário
  async getUserAnalytics(userId: string): Promise<{
    totalImpressions: number
    totalClicks: number
    totalClickRate: number
    animalAnalytics: AnalyticsData
    eventAnalytics: AnalyticsData
  }> {
    try {
      logSupabaseOperation('Get user analytics', { userId })

      // Buscar impressões dos conteúdos do usuário
      const { data: impressionsData, error: impressionsError } = await supabase
        .from('impressions')
        .select(`
          id,
          content_type,
          animals!inner(owner_id),
          events!inner(organizer_id)
        `)
        .or(`animals.owner_id.eq.${userId},events.organizer_id.eq.${userId}`)

      if (impressionsError) {
        throw handleSupabaseError(impressionsError)
      }

      // Buscar cliques dos conteúdos do usuário
      const { data: clicksData, error: clicksError } = await supabase
        .from('clicks')
        .select(`
          id,
          content_type,
          animals!inner(owner_id),
          events!inner(organizer_id)
        `)
        .or(`animals.owner_id.eq.${userId},events.organizer_id.eq.${userId}`)

      if (clicksError) {
        throw handleSupabaseError(clicksError)
      }

      // Processar dados
      const totalImpressions = impressionsData?.length || 0
      const totalClicks = clicksData?.length || 0
      const totalClickRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

      const animalImpressions = impressionsData?.filter(i => i.content_type === 'animal').length || 0
      const animalClicks = clicksData?.filter(c => c.content_type === 'animal').length || 0
      const animalClickRate = animalImpressions > 0 ? (animalClicks / animalImpressions) * 100 : 0

      const eventImpressions = impressionsData?.filter(i => i.content_type === 'event').length || 0
      const eventClicks = clicksData?.filter(c => c.content_type === 'event').length || 0
      const eventClickRate = eventImpressions > 0 ? (eventClicks / eventImpressions) * 100 : 0

      const analytics = {
        totalImpressions,
        totalClicks,
        totalClickRate: Math.round(totalClickRate * 100) / 100,
        animalAnalytics: {
          impressions: animalImpressions,
          clicks: animalClicks,
          clickRate: Math.round(animalClickRate * 100) / 100
        },
        eventAnalytics: {
          impressions: eventImpressions,
          clicks: eventClicks,
          clickRate: Math.round(eventClickRate * 100) / 100
        }
      }

      logSupabaseOperation('Get user analytics success', analytics)
      return analytics

    } catch (error) {
      logSupabaseOperation('Get user analytics error', null, error)
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalClickRate: 0,
        animalAnalytics: { impressions: 0, clicks: 0, clickRate: 0 },
        eventAnalytics: { impressions: 0, clicks: 0, clickRate: 0 }
      }
    }
  }

  // Verificar se elemento está no viewport
  isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  // Obter posição do elemento no viewport
  getViewportPosition(element: HTMLElement): ViewportPosition {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    }
  }

  // Hook para registrar impressão quando elemento entra no viewport
  observeElementImpression(
    element: HTMLElement,
    contentType: 'animal' | 'event' | 'article',
    contentId: string,
    userId?: string,
    options?: {
      carouselName?: string
      carouselPosition?: number
    }
  ): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const viewportPosition = this.getViewportPosition(entry.target as HTMLElement)
            this.recordImpression(contentType, contentId, userId, {
              viewportPosition,
              carouselName: options?.carouselName,
              carouselPosition: options?.carouselPosition
            })
            // Parar de observar após registrar
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.5 // Elemento deve estar 50% visível
      }
    )

    observer.observe(element)

    // Retornar função para limpar observer
    return () => observer.disconnect()
  }
}

export const analyticsService = new AnalyticsService()





