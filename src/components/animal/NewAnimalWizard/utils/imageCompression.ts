// src/components/animal/NewAnimalWizard/utils/imageCompression.ts

import imageCompression from 'browser-image-compression';
import { log } from '@/utils/logger';
import {
  TARGET_COMPRESSED_SIZE_MB,
  MAX_RESOLUTION_PX,
  USE_WEB_WORKER,
  COMPRESSION_OUTPUT_FORMAT,
  COMPRESSION_QUALITY,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  ERROR_MESSAGES
} from '@/config/uploadConstants';

/**
 * Configurações de compressão otimizadas para o sistema
 * Valores importados de uploadConstants para centralização
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: TARGET_COMPRESSED_SIZE_MB,
  maxWidthOrHeight: MAX_RESOLUTION_PX,
  useWebWorker: USE_WEB_WORKER,
  fileType: COMPRESSION_OUTPUT_FORMAT,
  initialQuality: COMPRESSION_QUALITY,
};

/**
 * Comprime uma imagem antes do upload
 * @param file - Arquivo original
 * @param index - Índice da imagem (para log)
 * @param signal - AbortSignal para cancelamento
 * @returns Arquivo comprimido
 */
export async function compressImage(file: File, index: number, signal?: AbortSignal): Promise<File> {
  try {
    // ✅ Verificar se foi abortado
    if (signal?.aborted) {
      throw new Error('Compressão cancelada pelo usuário');
    }

    const startTime = Date.now();
    const originalSizeMB = file.size / 1024 / 1024;

    log(`[Compressão] Iniciando compressão da imagem ${index + 1}`);
    log(`[Compressão] Tamanho original: ${originalSizeMB.toFixed(2)}MB`);

    // Se já está pequena, não comprimir
    if (originalSizeMB <= COMPRESSION_OPTIONS.maxSizeMB) {
      log(`[Compressão] Imagem ${index + 1} já está otimizada, pulando compressão`);
      return file;
    }

    // Comprimir imagem
    const compressedFile = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      onProgress: (progress) => {
        // Log de progresso a cada 25%
        if (progress % 25 === 0) {
          log(`[Compressão] Progresso imagem ${index + 1}: ${progress}%`);
        }
      },
    });

    const compressedSizeMB = compressedFile.size / 1024 / 1024;
    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    const timeTaken = Date.now() - startTime;

    log(`[Compressão] ✅ Imagem ${index + 1} comprimida com sucesso`);
    log(`[Compressão] Tamanho final: ${compressedSizeMB.toFixed(2)}MB`);
    log(`[Compressão] Redução: ${compressionRatio}%`);
    log(`[Compressão] Tempo: ${timeTaken}ms`);

    return compressedFile;
    
  } catch (error) {
    console.error(`[Compressão] ❌ Erro ao comprimir imagem ${index + 1}:`, error);
    log(`[Compressão] Falha na compressão, usando imagem original`);
    
    // Em caso de erro, retornar arquivo original
    return file;
  }
}

/**
 * Comprime múltiplas imagens em paralelo
 * @param files - Array de arquivos
 * @param onProgress - Callback de progresso
 * @param signal - AbortSignal para cancelamento
 * @returns Array de arquivos comprimidos
 */
export async function compressMultipleImages(
  files: File[],
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<File[]> {
  log(`[Compressão] Iniciando compressão de ${files.length} imagem(ns)`);
  
  // Notificar início do processo (evitar divisão por zero)
  if (files.length > 0) {
    onProgress?.(0, files.length);
  }
  
  const compressedFiles: File[] = [];
  
  // Múltiplas imagens - comprimir em paralelo
  const compressionPromises = files.map((file, index) => 
    compressImage(file, index, signal)
  );
  
  // Aguardar todas as compressões
  const results = await Promise.allSettled(compressionPromises);
  
  // Processar resultados
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      compressedFiles.push(result.value);
    } else {
      // Se falhar, usar arquivo original
      console.error(`[Compressão] Falha na imagem ${index + 1}:`, result.reason);
      compressedFiles.push(files[index]);
    }
    
    // Atualizar progresso
    onProgress?.(index + 1, files.length);
  });
  
  log(`[Compressão] ✅ Processo finalizado: ${compressedFiles.length}/${files.length} imagens processadas`);
  
  return compressedFiles;
}

/**
 * Valida se o arquivo é uma imagem válida
 * @param file - Arquivo para validar
 * @returns true se válido, mensagem de erro se inválido
 */
export function validateImageFile(file: File): true | string {
  // Validar tipo
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return ERROR_MESSAGES.invalidFileType(file.type);
  }

  // Validar tamanho
  const sizeMB = file.size / 1024 / 1024;
  
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return ERROR_MESSAGES.fileTooLarge(sizeMB);
  }

  return true;
}
