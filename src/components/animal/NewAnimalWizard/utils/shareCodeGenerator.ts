// src/components/animal/NewAnimalWizard/utils/shareCodeGenerator.ts

import { supabase } from '@/lib/supabase';
import { captureError } from '@/utils/logger';

/**
 * Gera código no formato ANI-XXXXXX-YY
 * XXXXXX = 6 dígitos aleatórios
 * YY = checksum (últimos 2 dígitos do timestamp)
 */
function generateShareCode(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
  const checksum = Date.now().toString().slice(-2); // Últimos 2 dígitos do timestamp
  return `ANI-${randomDigits}-${checksum}`;
}

/**
 * Gera código secreto único, validando no Supabase
 * Tenta até 5 vezes antes de falhar
 */
export async function generateUniqueShareCode(): Promise<string> {
  const maxAttempts = 5;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generateShareCode();
    
    try {
      // Verifica se já existe no banco
      const { data, error } = await supabase
        .from('animals')
        .select('id')
        .eq('share_code', code)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }
      
      if (!data) {
        // ✅ Código único encontrado!
        return code;
      }
      
      // Código já existe, tentar novamente
      console.warn(
        `[ShareCode] Código duplicado (${code}), tentativa ${attempt}/${maxAttempts}`
      );
      
    } catch (error) {
      captureError(error, { 
        context: 'generateUniqueShareCode',
        attempt,
        code 
      });
      
      // Se falhar na última tentativa, lançar erro
      if (attempt === maxAttempts) {
        throw new Error('Não foi possível gerar código único após 5 tentativas');
      }
    }
  }
  
  throw new Error('Não foi possível gerar código único');
}



