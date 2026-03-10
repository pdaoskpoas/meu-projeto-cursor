/**
 * 🔒 Validação robusta de uploads de imagens
 * Baseado em OWASP File Upload Cheat Sheet
 * Previne: uploads maliciosos, DoS, bypass de extensão
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DIMENSIONS = 4000; // 4000x4000px
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida tamanho do arquivo
 */
export const validateFileSize = (file: File): ImageValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Imagem muito grande. Máximo: ${sizeMB}MB. Seu arquivo: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
    };
  }
  
  return { valid: true };
};

/**
 * Valida tipo MIME do arquivo
 */
export const validateMimeType = (file: File): ImageValidationResult => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${file.type}. Use: JPG, PNG ou WEBP`
    };
  }
  
  return { valid: true };
};

/**
 * Valida extensão do arquivo
 */
export const validateFileExtension = (file: File): ImageValidationResult => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Extensão não permitida: ${extension}. Use: .jpg, .png ou .webp`
    };
  }
  
  return { valid: true };
};

/**
 * Valida dimensões da imagem
 */
export const validateImageDimensions = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
        resolve({
          valid: false,
          error: `Dimensões muito grandes. Máximo: ${MAX_DIMENSIONS}x${MAX_DIMENSIONS}px. Sua imagem: ${img.width}x${img.height}px`
        });
      } else if (img.width < 200 || img.height < 200) {
        resolve({
          valid: false,
          error: `Imagem muito pequena. Mínimo: 200x200px. Sua imagem: ${img.width}x${img.height}px`
        });
      } else {
        resolve({ valid: true });
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Não foi possível carregar a imagem. Arquivo pode estar corrompido.'
      });
    };
    
    img.src = objectUrl;
  });
};

/**
 * Validação completa de imagem (síncronas)
 */
export const validateImageSync = (file: File): ImageValidationResult => {
  // 1. Validar tamanho
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) return sizeCheck;
  
  // 2. Validar MIME type
  const mimeCheck = validateMimeType(file);
  if (!mimeCheck.valid) return mimeCheck;
  
  // 3. Validar extensão
  const extCheck = validateFileExtension(file);
  if (!extCheck.valid) return extCheck;
  
  return { valid: true };
};

/**
 * Validação completa de imagem (incluindo assíncronas)
 */
export const validateImage = async (file: File): Promise<ImageValidationResult> => {
  // Validações síncronas primeiro
  const syncValidation = validateImageSync(file);
  if (!syncValidation.valid) return syncValidation;
  
  // Validação assíncrona (dimensões)
  const dimensionsCheck = await validateImageDimensions(file);
  if (!dimensionsCheck.valid) return dimensionsCheck;
  
  return { valid: true };
};

/**
 * Valida múltiplas imagens
 */
export const validateImages = async (files: File[]): Promise<ImageValidationResult> => {
  for (const file of files) {
    const result = await validateImage(file);
    if (!result.valid) {
      return {
        valid: false,
        error: `${file.name}: ${result.error}`
      };
    }
  }
  
  return { valid: true };
};





