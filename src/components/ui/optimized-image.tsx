import React, { useState, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | undefined | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

/**
 * Componente de imagem otimizada com fallback automático
 * 
 * Características:
 * - Detecta erros de carregamento automaticamente
 * - Substitui por placeholder quando imagem falha
 * - Suporta lazy loading nativo
 * - Previne múltiplas tentativas de carregar mesma imagem quebrada
 * 
 * @example
 * <OptimizedImage 
 *   src={animal.image_url} 
 *   alt={animal.name}
 *   className="w-full h-48 object-cover"
 * />
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  fallbackSrc = '/placeholder.svg',
  className = '',
  loading = 'lazy',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // Prevenir loop infinito - só trocar uma vez
    if (!hasError && imageSrc !== fallbackSrc) {
      console.warn(`Failed to load image: ${imageSrc}`);
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    // Reset error state se imagem carregar com sucesso
    if (hasError) {
      setHasError(false);
    }
  };

  // Se src mudar, atualizar imageSrc (mas só se não estiver em erro)
  React.useEffect(() => {
    if (src && src !== imageSrc && !hasError) {
      setImageSrc(src);
      setHasError(false);
    }
  }, [src, imageSrc, hasError]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
};

export default OptimizedImage;


