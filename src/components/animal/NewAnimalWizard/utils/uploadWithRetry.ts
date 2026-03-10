// src/components/animal/NewAnimalWizard/utils/uploadWithRetry.ts

import { supabase } from '@/lib/supabase';
import { captureError, log } from '@/utils/logger';
import { logUploadMetric } from '@/utils/perfMetrics';
import { uploadResumableWithFallback } from '@/utils/resumableUpload';
import { 
  MAX_UPLOAD_RETRIES, 
  RETRY_BASE_DELAY_MS,
  ERROR_MESSAGES 
} from '@/config/uploadConstants';

/**
 * Faz upload de arquivo para Supabase Storage com retry automático
 * Usa exponential backoff: 1s, 2s, 4s
 */
export async function uploadWithRetry(
  file: File,
  userId: string,
  animalId: string,
  index: number,
  maxRetries = MAX_UPLOAD_RETRIES,
  signal?: AbortSignal
): Promise<string> {
  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ✅ Verificar se foi abortado
      if (signal?.aborted) {
        throw new Error(ERROR_MESSAGES.uploadCancelled);
      }

      const fileName = `${userId}/${animalId}/${Date.now()}_${index}.${file.name.split('.').pop()}`;
      
      log(`[Upload] Enviando foto ${index + 1}, tentativa ${attempt}/${maxRetries}`);
      
      // Upload para Supabase Storage
      let uploadError: Error | null = null;
      await uploadResumableWithFallback({
        file,
        bucket: 'animal-images',
        path: fileName,
        uploadFallback: async () => {
          const { error } = await supabase.storage
            .from('animal-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
          if (error) {
            uploadError = error;
            throw error;
          }
        }
      });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('animal-images')
        .getPublicUrl(fileName);

      log(`[Upload] ✅ Foto ${index + 1} enviada com sucesso`);
      logUploadMetric({
        type: 'upload',
        context: 'animal',
        fileName: file.name,
        sizeBytes: file.size,
        durationMs: Date.now() - startTime,
        retries: attempt - 1,
        success: true,
      });
      return publicUrlData.publicUrl;
      
    } catch (error: unknown) {
      lastError = error;
      
      captureError(error, {
        context: 'uploadWithRetry',
        attempt,
        fileName: file.name,
        fileSize: file.size,
        animalId
      });
      
      // Se falhar na última tentativa, lançar erro
      if (attempt === maxRetries) {
        logUploadMetric({
          type: 'upload',
          context: 'animal',
          fileName: file.name,
          sizeBytes: file.size,
          durationMs: Date.now() - startTime,
          retries: attempt - 1,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        throw new Error(
          `${ERROR_MESSAGES.uploadFailed(maxRetries)}: ${error.message}`
        );
      }

      // ✅ Se foi abortado, não aguardar retries
      if (signal?.aborted) {
        throw new Error(ERROR_MESSAGES.uploadCancelled);
      }

      // ✅ Exponential backoff baseado na constante
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[Upload] Tentativa ${attempt} falhou, aguardando ${delay}ms antes de tentar novamente...`
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // ✅ Garantir que sempre lança um erro válido
  if (lastError) {
    throw lastError;
  }
  throw new Error('Upload falhou de forma inesperada - nenhuma tentativa foi executada.');
}

/**
 * Faz upload de múltiplas fotos com controle de progresso
 */
export async function uploadMultiplePhotos(
  files: File[],
  userId: string,
  animalId: string,
  onProgress?: (current: number, total: number, retrying: boolean) => void,
  options?: { signal?: AbortSignal }
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  const parallelEnabled = import.meta.env.VITE_ANIMAL_UPLOAD_PARALLEL === 'true';
  const concurrencyRaw = Number(import.meta.env.VITE_ANIMAL_UPLOAD_CONCURRENCY ?? 2);
  const concurrency = Number.isFinite(concurrencyRaw)
    ? Math.max(1, Math.min(4, concurrencyRaw))
    : 2;
  
  log(`[Upload] Iniciando upload de ${files.length} foto(s)`);
  console.log(`[Upload] Detalhes dos arquivos:`, files.map(f => ({
    name: f.name,
    size: `${(f.size / 1024 / 1024).toFixed(2)}MB`,
    type: f.type
  })));

  if (!parallelEnabled || files.length <= 1 || concurrency === 1) {
    for (let i = 0; i < files.length; i++) {
      console.log(`[Upload] Processando foto ${i + 1}/${files.length}`);
      console.log(`[DEBUG] Detalhes foto ${i + 1}:`, {
        name: files[i].name,
        size: files[i].size,
        type: files[i].type
      });
      
      try {
        // Atualizar progresso ANTES do upload (mostra qual foto está sendo processada)
        if (onProgress) {
          console.log(`[Upload] Atualizando progresso: ${i + 1}/${files.length}`);
          onProgress(i + 1, files.length, false);
        }
        
        console.log(`[Upload] Chamando uploadWithRetry para foto ${i + 1}...`);
        const url = await uploadWithRetry(files[i], userId, animalId, i, MAX_UPLOAD_RETRIES, options?.signal);
        console.log(`[Upload] Retornou de uploadWithRetry para foto ${i + 1}`);
        
        if (!url) {
          throw new Error(`URL vazia retornada para foto ${i + 1}`);
        }
        
        uploadedUrls.push(url);
        log(`[Upload] Foto ${i + 1}/${files.length} concluída`);
        console.log(`[Upload] ✅ URL gerada: ${url}`);
        
      } catch (error) {
        console.error(`[Upload] ❌ Erro na foto ${i + 1}:`, error);
        if (onProgress) {
          onProgress(i + 1, files.length, true);
        }
        log(`[Upload] ❌ Falha no upload da foto ${i + 1}`);
        throw error;
      }
    }
    
    // Garantir que o progresso final seja marcado como completo
    console.log('[Upload] Todos os uploads concluídos, marcando progresso final');
    if (onProgress) {
      onProgress(files.length, files.length, false);
    }
    log(`[Upload] ✅ Todas as ${files.length} fotos foram enviadas com sucesso`);
    return uploadedUrls;
  }

  const results: Array<string | null> = Array.from({ length: files.length }).fill(null);
  let completed = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < files.length) {
      const index = cursor;
      cursor += 1;
      if (options?.signal?.aborted) {
        throw new Error(ERROR_MESSAGES.uploadCancelled);
      }
      const file = files[index];
      console.log(`[Upload] Processando foto ${index + 1}/${files.length}`);
      console.log(`[DEBUG] Detalhes foto ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      try {
        const url = await uploadWithRetry(file, userId, animalId, index, MAX_UPLOAD_RETRIES, options?.signal);
        if (!url) {
          throw new Error(`URL vazia retornada para foto ${index + 1}`);
        }
        results[index] = url;
        completed += 1;
        if (onProgress) {
          onProgress(completed, files.length, false);
        }
      } catch (error) {
        console.error(`[Upload] ❌ Erro na foto ${index + 1}:`, error);
        if (onProgress) {
          onProgress(completed, files.length, true);
        }
        log(`[Upload] ❌ Falha no upload da foto ${index + 1}`);
        throw error;
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
  await Promise.all(workers);
  const orderedUrls = results.filter((url): url is string => Boolean(url));
  if (orderedUrls.length !== files.length) {
    throw new Error('Falha ao concluir todos os uploads em paralelo.');
  }

  // Garantir que o progresso final seja marcado como completo
  console.log('[Upload] Todos os uploads concluídos, marcando progresso final');
  if (onProgress) {
    onProgress(files.length, files.length, false);
  }
  log(`[Upload] ✅ Todas as ${files.length} fotos foram enviadas com sucesso`);
  return orderedUrls;
}


