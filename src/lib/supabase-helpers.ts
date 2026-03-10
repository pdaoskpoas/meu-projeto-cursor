// Helper functions for Supabase operations

// Tipos de erro do Supabase
export type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Helper para tratar erros
export const handleSupabaseError = (error: unknown): SupabaseError => {
  const err = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  return {
    message: err?.message || 'Erro desconhecido',
    details: err?.details,
    hint: err?.hint,
    code: err?.code
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
  
  const err = error as { message?: string; code?: string };
  return {
    message: err.message || 'Erro desconhecido',
    code: err.code || 'UNKNOWN',
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
