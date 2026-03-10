import { supabase } from '@/lib/supabase'
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers'

export interface AnimalDraftRecord {
  id: string
  user_id: string
  status: 'draft' | 'ready'
  data: Record<string, unknown>
  created_at: string
  updated_at: string
  expires_at: string
}

class DraftsService {
  async getCurrentUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user?.id) throw new Error('Usuário não autenticado')
    return data.user.id
  }

  async createDraft(initialData: Record<string, unknown> = {}): Promise<AnimalDraftRecord> {
    const userId = await this.getCurrentUserId()
    logSupabaseOperation('Create animal_draft', { userId })
    const { data, error } = await supabase
      .from('animal_drafts')
      .insert({ user_id: userId, data: initialData, status: 'draft' })
      .select('*')
      .single()
    if (error) throw handleSupabaseError(error)
    return data as AnimalDraftRecord
  }

  async getDraftById(draftId: string): Promise<AnimalDraftRecord | null> {
    const { data, error } = await supabase
      .from('animal_drafts')
      .select('*')
      .eq('id', draftId)
      .single()
    if (error) return null
    return data as AnimalDraftRecord
  }

  async listUserDrafts(): Promise<AnimalDraftRecord[]> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await supabase
      .from('animal_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw handleSupabaseError(error)
    return (data as AnimalDraftRecord[]) || []
  }

  async updateDraftData(draftId: string, partialData: Record<string, unknown>): Promise<void> {
    logSupabaseOperation('Update animal_draft data', { draftId })
    const { error } = await supabase
      .from('animal_drafts')
      .update({ data: partialData })
      .eq('id', draftId)
    if (error) throw handleSupabaseError(error)
  }

  async markReady(draftId: string): Promise<void> {
    const { error } = await supabase
      .from('animal_drafts')
      .update({ status: 'ready' })
      .eq('id', draftId)
    if (error) throw handleSupabaseError(error)
  }

  async deleteDraft(draftId: string): Promise<void> {
    const { error } = await supabase
      .from('animal_drafts')
      .delete()
      .eq('id', draftId)
    if (error) throw handleSupabaseError(error)
  }

  async cleanupExpired(): Promise<void> {
    // Limpa rascunhos expirados do próprio usuário
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from('animal_drafts')
      .delete()
      .lt('expires_at', nowIso)
    if (error) throw handleSupabaseError(error)
  }

  // Converte rascunho em registro em animals (sem upload de imagens aqui)
  async finalizeDraftToAnimal(draftId: string): Promise<{ animalId: string }> {
    const draft = await this.getDraftById(draftId)
    if (!draft) throw new Error('Rascunho não encontrado')

    const d = draft.data || {}
    const name = d.name || ''
    const breed = d.breed || ''
    const gender: 'Macho' | 'Fêmea' = d.gender === 'Fêmea' ? 'Fêmea' : 'Macho'
    const birthDate = d.birthDate || '2000-01-01'
    const coat = d.color || null
    const currentCity = d.currentCity || null
    const currentState = d.currentState || null
    const allowMessages = !!d.allowMessages

    // Buscar dados do perfil para preencher haras_name
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, property_name')
      .eq('id', draft.user_id)
      .single()
    if (profileErr) throw handleSupabaseError(profileErr)

    const { data, error } = await supabase
      .from('animals')
      .insert({
        name,
        breed,
        gender,
        birth_date: birthDate,
        coat,
        current_city: currentCity,
        current_state: currentState,
        owner_id: draft.user_id,
        haras_id: draft.user_id,
        haras_name: profile?.property_name || null,
        ad_status: 'paused',
        allow_messages: allowMessages,
        can_edit: true
      })
      .select('id')
      .single()
    if (error) throw handleSupabaseError(error)

    // Não excluir imagens aqui; elas não foram enviadas ainda
    return { animalId: data.id as string }
  }
}

export const draftsService = new DraftsService()







