import { supabase } from '@/lib/supabase';

/**
 * 🔒 Service de Rate Limiting para proteger contra abuso de recursos
 * 
 * Limites recomendados:
 * - Login: 5 tentativas / 15 minutos
 * - Register: 3 tentativas / 30 minutos
 * - Upload: 10 uploads / 10 minutos
 * - API calls: 100 requests / 1 minuto
 */

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'blocked' | 'rate_limit_exceeded' | 'success';
  attempts?: number;
  maxAttempts?: number;
  message: string;
  blocked_until?: string;
}

export interface RateLimitConfig {
  operation: 'login' | 'register' | 'upload' | 'api_call' | string;
  maxAttempts: number;
  windowMinutes: number;
}

// Configurações padrão de rate limiting
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    operation: 'login',
    maxAttempts: 5,
    windowMinutes: 15
  },
  register: {
    operation: 'register',
    maxAttempts: 3,
    windowMinutes: 30
  },
  upload: {
    operation: 'upload',
    maxAttempts: 10,
    windowMinutes: 10
  },
  api_call: {
    operation: 'api_call',
    maxAttempts: 100,
    windowMinutes: 1
  }
};

class RateLimitingService {
  /**
   * Verifica se operação está dentro do rate limit
   * 
   * @param operation - Tipo de operação (login, register, upload, etc)
   * @param customConfig - Configuração customizada (opcional)
   * @returns Resultado do rate limit
   */
  async checkRateLimit(
    operation: string,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    try {
      // Obter configuração (padrão ou customizada)
      const config = {
        ...DEFAULT_LIMITS[operation],
        ...customConfig,
        operation
      };

      // Obter identificador do usuário (user_id ou IP simulado)
      const identifier = await this.getUserIdentifier();

      // Chamar function do Supabase
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier,
        operation: config.operation,
        max_attempts: config.maxAttempts,
        window_minutes: config.windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Em caso de erro, permitir operação (fail open)
        return {
          allowed: true,
          message: 'Rate limit check failed, allowing operation'
        };
      }

      return data as RateLimitResult;

    } catch (error) {
      console.error('Rate limiting service error:', error);
      // Fail open - permitir operação em caso de erro
      return {
        allowed: true,
        message: 'Rate limiting service unavailable'
      };
    }
  }

  /**
   * Obtém identificador do usuário (auth.uid() ou hash do IP)
   */
  private async getUserIdentifier(): Promise<string> {
    // Tentar obter user ID autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return user.id;
    }

    // Se não autenticado, usar identificador baseado em sessão
    // Em produção real, seria melhor usar IP do servidor via Edge Function
    let sessionId = sessionStorage.getItem('rate_limit_session_id');
    
    if (!sessionId) {
      sessionId = `session_${crypto.randomUUID()}`;
      sessionStorage.setItem('rate_limit_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Throttle genérico para funções (client-side)
   * Previne múltiplas chamadas rápidas
   */
  throttle<T extends (...args: never[]) => unknown>(
    func: T,
    waitMs: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    let lastRun = 0;

    return function (this: unknown, ...args: Parameters<T>) {
      const now = Date.now();

      if (now - lastRun >= waitMs) {
        func.apply(this, args);
        lastRun = now;
      } else {
        if (timeout) clearTimeout(timeout);
        
        timeout = setTimeout(() => {
          func.apply(this, args);
          lastRun = Date.now();
        }, waitMs - (now - lastRun));
      }
    };
  }

  /**
   * Debounce genérico para funções (client-side)
   * Espera até que usuário pare de fazer a ação
   */
  debounce<T extends (...args: never[]) => unknown>(
    func: T,
    waitMs: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function (this: unknown, ...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        func.apply(this, args);
      }, waitMs);
    };
  }
}

export const rateLimitingService = new RateLimitingService();

// Exports de conveniência
export const checkLoginLimit = () => rateLimitingService.checkRateLimit('login');
export const checkRegisterLimit = () => rateLimitingService.checkRateLimit('register');
export const checkUploadLimit = () => rateLimitingService.checkRateLimit('upload');
export const checkApiLimit = () => rateLimitingService.checkRateLimit('api_call');





