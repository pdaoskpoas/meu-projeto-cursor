// src/services/StorageService.ts
// ⚠️ ARQUIVO DESCONTINUADO
// Use storageServiceV2.ts para novas implementações

import { supabase } from '@/lib/supabase';

export class StorageService {
  /**
   * @deprecated Use storageServiceV2 em vez deste serviço
   */
  static async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  }

  /**
   * @deprecated Use storageServiceV2 em vez deste serviço
   */
  static async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }
}
