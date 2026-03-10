import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Barra de progresso que aparece no topo da página durante navegações.
 * 
 * Proporciona feedback visual ao usuário de que a página está carregando,
 * melhorando a percepção de performance da aplicação.
 * 
 * Utilizado por GitHub, YouTube, LinkedIn e outras grandes plataformas.
 */
const RouteProgressBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Evita "flash" em rotas rápidas exibindo a barra só se a navegação demorar um pouco.
    let progressTimer1: ReturnType<typeof setTimeout> | undefined;
    let progressTimer2: ReturnType<typeof setTimeout> | undefined;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const showTimer = setTimeout(() => {
      setIsLoading(true);
      setProgress(18);

      progressTimer1 = setTimeout(() => setProgress(45), 140);
      progressTimer2 = setTimeout(() => setProgress(72), 280);

      finishTimer = setTimeout(() => {
        setProgress(100);
        hideTimer = setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 160);
      }, 420);
    }, 120);

    return () => {
      clearTimeout(showTimer);
      if (progressTimer1) {
        clearTimeout(progressTimer1);
      }
      if (progressTimer2) {
        clearTimeout(progressTimer2);
      }
      if (finishTimer) {
        clearTimeout(finishTimer);
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [location.pathname]);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      />
    </div>
  );
};

export default RouteProgressBar;



