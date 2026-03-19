import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { diagnostics } from '@/lib/diagnostics'

// Configuração do Supabase via variáveis de ambiente (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ✅ Validação das variáveis de ambiente
if (!supabaseUrl || supabaseUrl.trim() === '') {
  const error = '❌ VITE_SUPABASE_URL não está definida. Verifique seu arquivo .env ou .env.local'
  console.error(error)
  if (import.meta.env.DEV) {
    throw new Error(error)
  }
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  const error = '❌ VITE_SUPABASE_ANON_KEY não está definida. Verifique seu arquivo .env ou .env.local'
  console.error(error)
  if (import.meta.env.DEV) {
    throw new Error(error)
  }
}

// 🚨 VALIDAÇÃO CRÍTICA: Detectar uso de SERVICE_ROLE_KEY no navegador
if (supabaseAnonKey) {
  // Detectar chaves secretas comuns
  const isSecretKey = 
    supabaseAnonKey.includes('sb_secret_') ||
    supabaseAnonKey.toLowerCase().includes('service_role') ||
    (supabaseAnonKey.toLowerCase().includes('secret') && !supabaseAnonKey.startsWith('eyJ'));
  
  if (isSecretKey) {
    const error = `
🚨 ERRO CRÍTICO DE SEGURANÇA 🚨

Você está usando a SERVICE_ROLE_KEY (chave secreta) no lugar da ANON_KEY (chave pública)!

Isso é MUITO PERIGOSO e causa erros 401 (Unauthorized).

CORREÇÃO IMEDIATA:
1. Acesse: https://app.supabase.com → Settings → API
2. Copie a "anon public" key (não a "service_role" key!)
3. Atualize VITE_SUPABASE_ANON_KEY no arquivo .env.local
4. Revogue a SERVICE_ROLE_KEY exposta no dashboard

A ANON_KEY correta:
- ✅ Começa com "eyJ..." (é um JWT)
- ✅ Está marcada como "anon public" no dashboard
- ✅ Pode ser usada no navegador (é segura)

A SERVICE_ROLE_KEY (ERRADA):
- ❌ Começa com "sb_secret_" ou contém "secret"
- ❌ Está marcada como "service_role" no dashboard
- ❌ NUNCA deve ser usada no navegador!

Veja o arquivo CORRECAO_URGENTE_CHAVE_SUPABASE.md para mais detalhes.
    `.trim();
    
    console.error('🚨🚨🚨', error);
    console.error('🔴 Chave detectada (primeiros 50 caracteres):', supabaseAnonKey.substring(0, 50) + '...');
    
    if (import.meta.env.DEV) {
      // Em desenvolvimento, não bloquear mas alertar fortemente
      console.warn('⚠️ Continuando em modo desenvolvimento, mas CORRIJA IMEDIATAMENTE!');
    } else {
      // Em produção, bloquear completamente
      throw new Error('SERVICE_ROLE_KEY detectada no navegador. CORREÇÃO OBRIGATÓRIA!');
    }
  }
}

// ✅ Log de diagnóstico em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔵 Supabase Config:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NÃO DEFINIDA',
    anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
}

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

// Diagnostico de sessao em runtime (habilitado em DEV ou localStorage vdc:diagnostics=1).
supabase.auth.onAuthStateChange((event, session) => {
  diagnostics.info('supabase-client', 'Auth event observed', {
    event,
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
    expiresAt: session?.expires_at ?? null
  });
});

// ✅ Função de teste de conexão (útil para diagnóstico)
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  error?: string;
  details?: unknown;
}> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      };
    }

    // Teste básico de conexão - tentar buscar uma tabela simples
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      diagnostics.error('supabase-connection-test', 'Erro ao testar conexão', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      };
    }

    diagnostics.info('supabase-connection-test', 'Conexão testada com sucesso', {
      hasData: !!data,
      dataCount: Array.isArray(data) ? data.length : 0
    });

    return {
      success: true,
      details: {
        hasData: !!data,
        dataCount: Array.isArray(data) ? data.length : 0
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.error('supabase-connection-test', 'Exceção ao testar conexão', error);
    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
};

// ✅ Teste automático de conexão em desenvolvimento
if (import.meta.env.DEV) {
  // Executar teste após um pequeno delay para garantir que tudo está carregado
  setTimeout(() => {
    testSupabaseConnection().then(result => {
      if (!result.success) {
        console.warn('⚠️ Aviso: Teste de conexão Supabase falhou:', result.error);
        console.warn('💡 Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas no arquivo .env.local');
      } else {
        console.log('✅ Conexão Supabase verificada com sucesso');
      }
    }).catch(err => {
      console.error('❌ Erro ao testar conexão Supabase:', err);
    });
  }, 1000);
}

// Tipos de erro do Supabase
export type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Helper para tratar erros
export const handleSupabaseError = (error: unknown): SupabaseError => {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      message: (err.message as string) || 'Erro desconhecido',
      details: err.details as string | undefined,
      hint: err.hint as string | undefined,
      code: err.code as string | undefined
    };
  }
  return {
    message: typeof error === 'string' ? error : 'Erro desconhecido'
  };
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
