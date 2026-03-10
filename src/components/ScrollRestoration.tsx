import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente ROBUSTO de gerenciamento de scroll que:
 * 1. SEMPRE reseta o scroll para o topo ao navegar para uma nova página
 * 2. Salva a posição do scroll quando o usuário navega para outra página
 * 3. Restaura a posição quando o usuário volta (botão voltar do navegador)
 * 
 * Versão AGRESSIVA que previne qualquer problema de scroll mantido.
 * Utilizado por Twitter, Reddit, Instagram web, etc.
 */

interface ScrollPosition {
  x: number;
  y: number;
}

const scrollPositions = new Map<string, ScrollPosition>();

const ScrollRestoration = () => {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);
  const isNavigatingRef = useRef(false);

  // useLayoutEffect executa ANTES da pintura na tela (previne flash visual)
  useLayoutEffect(() => {
    // FORÇA scroll para o topo IMEDIATAMENTE ao detectar mudança de rota
    // Isso previne qualquer "flash" do scroll anterior
    if (isNavigatingRef.current) {
      window.scrollTo(0, 0);
      isNavigatingRef.current = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = prevPathRef.current;

    // Marca que estamos navegando
    if (previousPath !== currentPath) {
      isNavigatingRef.current = true;
      
      // Salva a posição de scroll da página anterior
      scrollPositions.set(previousPath, {
        x: window.scrollX,
        y: window.scrollY,
      });
    }

    // Verifica se é uma navegação "voltar" do navegador
    const savedPosition = scrollPositions.get(currentPath);
    const isBackNavigation = savedPosition && 
      window.history.state && 
      window.history.state.idx !== undefined;

    if (isBackNavigation && savedPosition) {
      // Restaura posição para navegação "voltar"
      // Múltiplos requestAnimationFrame garantem que o DOM está pronto
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: savedPosition.y,
            left: savedPosition.x,
            behavior: 'instant',
          });
        });
      });
    } else {
      // Nova navegação ou navegação "forward" - SEMPRE vai para o topo
      // Força múltiplas vezes para garantir
      window.scrollTo(0, 0);
      
      // Backup: força novamente após render
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
      
      // Backup final: força após pequeno delay
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
    }

    prevPathRef.current = currentPath;
  }, [location.pathname, location.key]); // location.key muda em cada navegação

  // Limpa posições antigas para evitar uso excessivo de memória
  useEffect(() => {
    // Mantém apenas as últimas 10 posições
    if (scrollPositions.size > 10) {
      const firstKey = scrollPositions.keys().next().value;
      if (firstKey) {
        scrollPositions.delete(firstKey);
      }
    }
  }, [location.pathname]);

  // Force scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
};

export default ScrollRestoration;

