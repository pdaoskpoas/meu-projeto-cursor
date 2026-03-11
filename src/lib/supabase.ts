import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Configuração do Supabase via variáveis de ambiente (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// 🔒 Configuração segura do cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // 🔒 Evita exposição de tokens em URL
    flowType: 'pkce',            // 🔒 PKCE para OAuth seguro
    // 🔒 Storage customizado poderia ser adicionado aqui para encryption
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'cavalaria-digital-web',
    }
  }
})

// Tipos de erro do Supabase
export type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Helper para tratar erros
export const handleSupabaseError = (error: unknown): SupabaseError => {
  return {
    message: error?.message || 'Erro desconhecido',
    details: error?.details,
    hint: error?.hint,
    code: error?.code
  }
}

// 🔒 Campos sensíveis que devem ser mascarados em logs
const SENSITIVE_FIELDS = [
  'email', 'password', 'token', 'access_token', 'refresh_token',
  'cpf', 'phone', 'phone_number', 'credit_card', 'card_number',
  'cvv', 'secret', 'key', 'api_key', 'authorization'
]

// 🔒 Sanitização de dados para logs - Remove informações sensíveis
const sanitizeLogData = (data: unknown, depth = 0): unknown => {
  if (!data || depth > 3) return '[Redacted - Max Depth]'
  
  // Strings, números, booleanos, null
  if (typeof data !== 'object') return data
  
  // Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, depth + 1))
  }
  
  // Objetos
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    // Verificar se é campo sensível
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field))
    
    if (isSensitive) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// 🔒 Sanitização de erros - Remove detalhes internos sensíveis
const sanitizeError = (error: unknown): { message: string; code: string } | null => {
  if (!error) return null
  
  return {
    message: error.message || 'Erro desconhecido',
    code: error.code || 'UNKNOWN',
    // NÃO expor: details, hint, stack trace completo
  }
}

// Helper para logs de desenvolvimento (SANITIZADO)
export const logSupabaseOperation = (operation: string, data?: unknown, error?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔵 Supabase: ${operation}`)
    if (data) console.log('Data:', sanitizeLogData(data))
    if (error) console.error('Error:', sanitizeError(error))
    console.groupEnd()
  }
}
