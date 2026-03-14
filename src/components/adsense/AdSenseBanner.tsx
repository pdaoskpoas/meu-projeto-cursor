import { useEffect, useRef } from 'react';

interface AdSenseBannerProps {
  code: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente para exibir um banner do Google AdSense
 * Renderiza o código HTML/JS do anúncio de forma segura
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ 
  code, 
  className = '',
  style 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    // Se não há código ou já foi renderizado, não fazer nada
    if (!code || renderedRef.current || !containerRef.current) {
      return;
    }

    // Limpar conteúdo anterior
    containerRef.current.innerHTML = '';

    try {
      // Inserir o código HTML do anúncio
      containerRef.current.innerHTML = code.trim();
      renderedRef.current = true;

      // Executar scripts inline se houver
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    } catch (error) {
      console.error('Erro ao renderizar banner do AdSense:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [code]);

  // Se não há código, não renderizar nada
  if (!code) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`adsense-banner ${className}`}
      style={{
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '2rem 0',
        ...style,
      }}
      data-adsense-banner="true"
    />
  );
};
