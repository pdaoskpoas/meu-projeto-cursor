import { useSessionKeepAlive } from '@/hooks/useSessionKeepAlive';

/**
 * Gerencia a sessão do usuário: mantém o token JWT ativo proativamente,
 * evitando "congelamentos" após períodos de inatividade.
 */
const SessionTimeoutManager = () => {
  useSessionKeepAlive();
  return null;
};

export default SessionTimeoutManager;





