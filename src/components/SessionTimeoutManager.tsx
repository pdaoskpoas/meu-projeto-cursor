import { useSessionTimeout } from '@/hooks/useSessionTimeout';

/**
 * Gerencia a saúde da sessão enquanto o usuário navega pelo sistema.
 * Mantém a autenticação sincronizada durante sessões longas.
 */
const SessionTimeoutManager = () => {
  useSessionTimeout();
  return null; // Componente invisible
};

export default SessionTimeoutManager;





