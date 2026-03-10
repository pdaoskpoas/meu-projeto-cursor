// src/components/animal/NewAnimalWizard/utils/uploadTimeout.ts

import { log } from '@/utils/logger';
import {
  UPLOAD_TIMEOUT_PER_IMAGE_MS,
  COMPRESSION_TIMEOUT_PER_IMAGE_MS
} from '@/config/uploadConstants';

/**
 * Executa uma promessa com timeout e suporte a cancelamento via AbortController
 * @param promise - A promessa a ser executada
 * @param timeoutMs - Tempo limite em milissegundos
 * @param errorMessage - Mensagem de erro caso o timeout seja atingido
 * @param controller - AbortController para cancelamento
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operação excedeu o tempo limite',
  controller?: AbortController
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      log(`[Timeout] Operação excedeu ${timeoutMs}ms - Abortando...`);
      
      // ✅ Abortar operação quando atingir timeout
      if (controller) {
        controller.abort();
        log('[Timeout] AbortController acionado');
      }
      
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    // ✅ Garantir que o controller foi abortado
    if (controller && !controller.signal.aborted) {
      controller.abort();
      log('[Timeout] AbortController acionado no catch');
    }
    throw error;
  }
}

/**
 * Timeout padrão para operações de upload (importado das constantes)
 */
export const UPLOAD_TIMEOUT_PER_IMAGE = UPLOAD_TIMEOUT_PER_IMAGE_MS;

/**
 * Timeout padrão para compressão (importado das constantes)
 */
export const COMPRESSION_TIMEOUT_PER_IMAGE = COMPRESSION_TIMEOUT_PER_IMAGE_MS;
