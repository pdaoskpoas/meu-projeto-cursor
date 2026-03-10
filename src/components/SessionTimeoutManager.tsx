import { useSessionTimeout } from '@/hooks/useSessionTimeout';

/**
 * 🔒 Componente de gerenciamento de timeout de sessão
 * Ativa automaticamente quando usuário está logado
 * Logout após 30 minutos de inatividade
 */
const SessionTimeoutManager = () => {
  useSessionTimeout();
  return null; // Componente invisible
};

export default SessionTimeoutManager;





