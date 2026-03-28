// Tipos principais do Supabase

// Perfil PÚBLICO - SEM dados sensíveis (usado para exibir perfis de outros usuários)
// Corresponde à VIEW public_profiles no banco de dados
export interface PublicProfile {
  id: string
  name: string
  avatar_url: string | null
  account_type: 'personal' | 'institutional'
  property_name: string | null
  property_type: 'haras' | 'fazenda' | 'cte' | 'central-reproducao' | null
  property_id: string | null
  public_code: string | null
  plan: 'free' | 'essencial' | 'criador' | 'haras' | 'elite' | 'vip' | 'basic' | 'pro' | 'ultra'
  city: string | null
  state: string | null
  country: string | null
  founded_year: string | null
  owner_name: string | null
  bio: string | null
  instagram: string | null
  is_active: boolean
  is_suspended: boolean
  created_at: string
}

// Perfil COMPLETO - Inclui PII (usado APENAS para o próprio usuário logado ou admin)
export interface Profile extends PublicProfile {
  email: string
  cpf: string | null
  phone: string | null
  cep: string | null
  plan_expires_at: string | null
  plan_purchased_at: string | null
  is_annual_plan: boolean
  available_boosts: number
  boosts_reset_at: string | null
  role: 'user' | 'admin'
  updated_at: string
  marketing_consent: boolean
  marketing_consent_at: string | null
}

export interface Animal {
  id: string
  name: string
  breed: string
  gender: 'Macho' | 'Fêmea'
  birth_date: string
  coat: string | null
  category: 'Garanhão' | 'Castrado' | 'Doadora' | 'Matriz' | 'Potro' | 'Potra' | 'Outro' | null
  is_registered: boolean
  height: number | null
  weight: number | null
  chip: string | null
  registration_number: string | null
  father_name: string | null
  mother_name: string | null
  paternal_grandfather_name: string | null
  paternal_grandmother_name: string | null
  maternal_grandfather_name: string | null
  maternal_grandmother_name: string | null
  paternal_gg_father_name: string | null
  paternal_gg_mother_name: string | null
  paternal_gm_father_name: string | null
  paternal_gm_mother_name: string | null
  maternal_gg_father_name: string | null
  maternal_gg_mother_name: string | null
  maternal_gm_father_name: string | null
  maternal_gm_mother_name: string | null
  cep: string | null
  current_city: string | null
  current_state: string | null
  description: string | null
  owner_id: string | null
  haras_id: string | null
  haras_name: string | null
  ad_status: 'active' | 'paused' | 'expired' | 'draft'
  published_at: string
  expires_at: string
  is_boosted: boolean
  boost_expires_at: string | null
  boosted_by: string | null
  boosted_at: string | null
  allow_messages: boolean
  featured: boolean
  can_edit: boolean
  titles: string[] | null
  images: string[] // URLs das imagens no Supabase Storage
  auto_renew: boolean // Se deve renovar automaticamente após 30 dias
  is_individual_paid: boolean
  share_code: string | null
  created_at: string
  updated_at: string
}

export interface AnimalWithStats extends Animal {
  impression_count: number
  click_count: number
  click_rate: number
  owner_name: string
  owner_public_code: string
  owner_account_type: string
  owner_property_name: string | null  // Nome da propriedade institucional (haras, fazenda, CTE, etc)
  owner_property_type: string | null  // Tipo da propriedade ('haras' | 'fazenda' | 'cte' | 'central-reproducao')
}

export interface Event {
  id: string
  title: string
  description: string | null
  event_type: string | null
  start_date: string
  end_date: string | null
  location: string | null
  city: string | null
  state: string | null
  organizer_id: string | null
  max_participants: number | null
  registration_deadline: string | null
  ad_status: 'active' | 'paused' | 'expired' | 'draft'
  published_at: string
  expires_at: string
  is_boosted: boolean
  boost_expires_at: string | null
  boosted_by: string | null
  boosted_at: string | null
  can_edit: boolean
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface EventWithStats extends Event {
  impression_count: number
  click_count: number
  click_rate: number
  organizer_name: string
  organizer_public_code: string
}

export interface Article {
  id: string
  title: string
  content: string
  excerpt: string | null
  author_id: string | null
  category: string | null
  tags: string[]
  cover_image_url: string | null
  published_at: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface UserDashboardStats {
  user_id: string
  name: string
  plan: string
  available_boosts: number
  active_animals: number
  active_events: number
  total_animal_impressions: number
  total_animal_clicks: number
  total_event_impressions: number
  total_event_clicks: number
  active_boosts: number
}

export interface SearchAnimalsResult {
  id: string
  name: string
  breed: string
  gender: string
  birth_date: string
  coat: string
  current_city: string
  current_state: string
  owner_name: string
  property_name: string  // Mapeado de owner_property_name do banco
  owner_account_type: string  // Tipo de conta do proprietário
  owner_property_type: string | null  // Tipo da propriedade
  is_boosted: boolean
  impression_count: number
  click_count: number
  click_rate: number
  published_at: string
  category: string | null
  is_registered: boolean
  registration_number: string | null
  images: string[]  // URLs das imagens
}

// Tipos para inserção
export interface ProfileInsert {
  id: string
  name: string
  email: string
  cpf?: string | null
  phone?: string | null
  account_type?: 'personal' | 'institutional'
  property_name?: string | null
  property_type?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao' | null
  property_id?: string | null
  public_code?: string | null
  plan?: 'free' | 'essencial' | 'criador' | 'haras' | 'elite' | 'vip' | 'basic' | 'pro' | 'ultra'
  marketing_consent?: boolean
  marketing_consent_at?: string | null
}

export interface AnimalInsert {
  name: string
  breed: string
  gender: 'Macho' | 'Fêmea'
  birth_date: string
  coat?: string | null
  category?: 'Garanhão' | 'Castrado' | 'Doadora' | 'Matriz' | 'Potro' | 'Potra' | 'Outro' | null
  is_registered?: boolean
  height?: number | null
  weight?: number | null
  chip?: string | null
  registration_number?: string | null
  father_name?: string | null
  mother_name?: string | null
  paternal_grandfather_name?: string | null
  paternal_grandmother_name?: string | null
  maternal_grandfather_name?: string | null
  maternal_grandmother_name?: string | null
  paternal_gg_father_name?: string | null
  paternal_gg_mother_name?: string | null
  paternal_gm_father_name?: string | null
  paternal_gm_mother_name?: string | null
  maternal_gg_father_name?: string | null
  maternal_gg_mother_name?: string | null
  maternal_gm_father_name?: string | null
  maternal_gm_mother_name?: string | null
  cep?: string | null
  current_city?: string | null
  current_state?: string | null
  description?: string | null
  owner_id?: string | null
  haras_id?: string | null
  haras_name?: string | null
  titles?: string[] | null
  images?: string[] // URLs das imagens no Supabase Storage
  auto_renew?: boolean // Se deve renovar automaticamente após 30 dias
  ad_status?: 'active' | 'paused' | 'expired' | 'draft'
  allow_messages?: boolean
  is_individual_paid?: boolean
  share_code?: string | null
}

// Tipos para analytics
export interface ImpressionInsert {
  content_type: 'animal' | 'event' | 'article'
  content_id: string
  user_id?: string | null
  session_id: string
  page_url?: string | null
  referrer?: string | null
  viewport_position?: Record<string, unknown> | null
  carousel_name?: string | null
  carousel_position?: number | null
  user_agent?: string | null
  ip_address?: string | null
}

export interface ClickInsert {
  content_type: 'animal' | 'event' | 'article'
  content_id: string
  user_id?: string | null
  session_id: string
  page_url?: string | null
  referrer?: string | null
  click_target?: string | null
  user_agent?: string | null
  ip_address?: string | null
}

export interface PageVisitInsert {
  page_key: string
  page_path: string
  page_title?: string | null
  session_id: string
  user_id?: string | null
  referrer?: string | null
  user_agent?: string | null
  metadata?: Record<string, unknown> | null
}
