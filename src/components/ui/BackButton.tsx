import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  showLabel?: boolean;
  variant?: 'link' | 'ghost' | 'icon';
  className?: string;
}

// -------------------------------------------------------
// Navegacao interna tracker
// -------------------------------------------------------
// Conta quantas navegacoes SPA ocorreram nesta sessao.
// Diferente de window.history.length (que inclui historico
// de outros sites e sobrevive a refresh), este contador
// e resetado a cada carregamento da pagina — portanto
// reflete APENAS o historico real dentro da aplicacao.
// -------------------------------------------------------
let internalNavCount = 0;

export function incrementInternalNavCount() {
  internalNavCount++;
}

export function getInternalNavCount() {
  return internalNavCount;
}

// Apenas para testes — permite resetar o contador
export function _resetInternalNavCount() {
  internalNavCount = 0;
}

// -------------------------------------------------------
// Logica de decisao: eh seguro voltar no historico?
// -------------------------------------------------------
export function canSafelyGoBack(): boolean {
  // 1. Precisa ter historico no browser
  if (window.history.length <= 1) return false;

  // 2. Precisa ter pelo menos 1 navegacao SPA registrada.
  //    Isso protege contra:
  //    - Acesso direto via URL (deep link): navCount === 0
  //    - Abertura em nova aba: navCount === 0
  //    - Refresh (F5): navCount reseta para 0
  //    - Entrada via busca externa: navCount === 0
  if (internalNavCount < 1) return false;

  // 3. Valida referrer — se existe, deve ser do mesmo dominio.
  //    document.referrer e vazio em deep link, nova aba e
  //    refresh, mas quando presente (ex: vindo do Google)
  //    precisamos verificar que nao e externo.
  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerOrigin = new URL(referrer).origin;
      if (referrerOrigin !== window.location.origin) {
        return false;
      }
    } catch {
      // URL invalida no referrer — nao e seguro
      return false;
    }
  }

  // 4. Verifica indice do React Router no history.state.
  //    idx === 0 significa que estamos na primeira entrada
  //    da sessao do router — voltar sairia do SPA.
  const state = window.history.state;
  if (state && typeof state.idx === 'number' && state.idx === 0) {
    return false;
  }

  return true;
}

/**
 * Botao de voltar padronizado que respeita o historico real do navegador.
 *
 * Usa navigate(-1) SOMENTE quando todas as condicoes sao atendidas:
 *   - history.length > 1
 *   - Houve pelo menos 1 navegacao interna (SPA) nesta sessao
 *   - document.referrer (se existir) e do mesmo dominio
 *   - React Router idx > 0
 *
 * Caso contrario, navega para fallbackPath.
 */
const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath = '/',
  label = 'Voltar',
  showLabel = true,
  variant = 'link',
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (canSafelyGoBack()) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className={cn('shrink-0', className)}
        aria-label={label}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'ghost') {
    return (
      <Button
        variant="ghost"
        onClick={handleBack}
        className={cn('gap-2', className)}
      >
        <ArrowLeft className="h-4 w-4" />
        {showLabel && <span>{label}</span>}
      </Button>
    );
  }

  // variant === 'link' (default)
  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'inline-flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors font-medium',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </button>
  );
};

export default BackButton;
