import { useEffect, useRef } from 'react';

interface AdSenseScriptProps {
  script: string | null;
}

/**
 * Componente para carregar o script global do Google AdSense
 * Garante que o script seja carregado apenas uma vez por página
 */
export const AdSenseScript: React.FC<AdSenseScriptProps> = ({ script }) => {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Se não há script ou já foi carregado, não fazer nada
    if (!script || scriptLoadedRef.current) {
      return;
    }

    // Verificar se o script já existe no DOM
    const existingScript = document.querySelector('script[data-adsense-global]');
    if (existingScript) {
      scriptLoadedRef.current = true;
      return;
    }

    // Criar e inserir o script
    try {
      // Extrair o conteúdo do script (pode ser um script tag completo ou apenas o código)
      const scriptContent = script.trim();
      
      // Se já é um script tag completo, inserir diretamente
      if (scriptContent.startsWith('<script')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = scriptContent;
        const scriptElement = tempDiv.querySelector('script');
        
        if (scriptElement) {
          scriptElement.setAttribute('data-adsense-global', 'true');
          scriptElement.setAttribute('async', 'true');
          document.head.appendChild(scriptElement);
          scriptLoadedRef.current = true;
        }
      } else {
        // Se é apenas código JavaScript, criar um script tag
        const scriptElement = document.createElement('script');
        scriptElement.setAttribute('data-adsense-global', 'true');
        scriptElement.setAttribute('async', 'true');
        scriptElement.textContent = scriptContent;
        document.head.appendChild(scriptElement);
        scriptLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Erro ao carregar script do AdSense:', error);
    }
  }, [script]);

  // Este componente não renderiza nada no DOM
  return null;
};
