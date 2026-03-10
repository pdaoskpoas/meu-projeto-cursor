// src/config/uploadConstants.ts

/**
 * Constantes de configuração para upload e processamento de imagens
 * 
 * Centralizadas para facilitar:
 * - Manutenção
 * - Testes A/B de performance
 * - Ajustes por ambiente (dev/prod)
 */

// ============================================
// TIMEOUTS
// ============================================

/**
 * Tempo máximo para upload de uma imagem (em milissegundos)
 * Valor baseado em: conexão 3G (2Mbps) + imagem 1MB = ~4s
 * Adicional de margem: 26s para retry
 */
export const UPLOAD_TIMEOUT_PER_IMAGE_MS = 30_000; // 30 segundos

/**
 * Tempo máximo para compressão de uma imagem (em milissegundos)
 * Compressão típica: 0.5-1s por imagem
 * Margem para dispositivos lentos: 14s
 */
export const COMPRESSION_TIMEOUT_PER_IMAGE_MS = 15_000; // 15 segundos

/**
 * Tempo máximo total para operação completa (em milissegundos)
 * Para 4 imagens: compressão (60s) + upload (120s) = 180s
 */
export const TOTAL_OPERATION_TIMEOUT_MS = 180_000; // 3 minutos

// ============================================
// LIMITES DE ARQUIVO
// ============================================

/**
 * Tamanho máximo por imagem antes da compressão (em bytes)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Número máximo de imagens por upload
 */
export const MAX_FILES_PER_UPLOAD = 4;

const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Tamanho alvo após compressão (em MB)
 * Pode ser ajustado por ambiente via VITE_IMAGE_TARGET_MB
 */
export const TARGET_COMPRESSED_SIZE_MB = parseNumberEnv(
  import.meta.env.VITE_IMAGE_TARGET_MB,
  2.5
);

/**
 * Resolução máxima (largura ou altura)
 * Pode ser ajustado por ambiente via VITE_IMAGE_MAX_RESOLUTION_PX
 */
export const MAX_RESOLUTION_PX = parseNumberEnv(
  import.meta.env.VITE_IMAGE_MAX_RESOLUTION_PX,
  2800
);

// ============================================
// RETRY E BACKOFF
// ============================================

/**
 * Número máximo de tentativas para upload
 */
export const MAX_UPLOAD_RETRIES = 3;

/**
 * Delay base para exponential backoff (em milissegundos)
 * Retries: 1s, 2s, 4s
 */
export const RETRY_BASE_DELAY_MS = 1000; // 1 segundo

// ============================================
// COMPRESSÃO
// ============================================

/**
 * Qualidade inicial de compressão JPEG (0-1)
 * Pode ser ajustado por ambiente via VITE_IMAGE_QUALITY
 */
export const COMPRESSION_QUALITY = parseNumberEnv(
  import.meta.env.VITE_IMAGE_QUALITY,
  0.92
);

/**
 * Formato de saída da compressão
 */
export const COMPRESSION_OUTPUT_FORMAT = 'image/jpeg';

/**
 * Usar Web Worker para compressão (não bloqueia UI)
 */
export const USE_WEB_WORKER = true;

// ============================================
// TIPOS DE ARQUIVO PERMITIDOS
// ============================================

/**
 * MIME types aceitos para upload
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
] as const;

/**
 * Extensões aceitas (para UI)
 */
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

// ============================================
// PERFORMANCE BENCHMARKS
// ============================================

/**
 * Métricas esperadas de performance
 * Útil para monitoramento e alertas
 */
export const PERFORMANCE_BENCHMARKS = {
  /** Tempo médio de compressão por imagem */
  compressionAvgMs: 1_200,
  
  /** Tempo médio de upload por imagem */
  uploadAvgMs: 3_000,
  
  /** Tempo máximo aceitável para operação completa (4 imagens) */
  totalMaxMs: 30_000,
  
  /** Tempo de cancelamento (deve ser instantâneo) */
  cancellationMaxMs: 100
} as const;

// ============================================
// MENSAGENS DE ERRO
// ============================================

export const ERROR_MESSAGES = {
  uploadCancelled: 'Upload cancelado pelo usuário',
  uploadTimeout: 'Upload está demorando muito. Verifique sua conexão.',
  compressionTimeout: 'Compressão está demorando muito. Tente imagens menores.',
  sessionExpired: 'Sessão expirada. Por favor, faça login novamente.',
  fileTooLarge: (sizeMB: number) => `Arquivo muito grande: ${sizeMB.toFixed(1)}MB. Máximo: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
  invalidFileType: (type: string) => `Tipo não suportado: ${type}. Use ${ALLOWED_EXTENSIONS.join(', ')}`,
  uploadFailed: (retries: number) => `Upload falhou após ${retries} tentativas`
} as const;

// ============================================
// MODO DEBUG
// ============================================

/**
 * Ativar logs detalhados (desenvolvimento)
 */
export const DEBUG_MODE = import.meta.env.DEV || false;

/**
 * Log de performance (timing de cada etapa)
 */
export const LOG_PERFORMANCE = DEBUG_MODE;

