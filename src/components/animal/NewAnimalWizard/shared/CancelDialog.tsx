// src/components/animal/NewAnimalWizard/shared/CancelDialog.tsx

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { clearPlanCache } from '@/services/planService';

interface CancelDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CancelDialog: React.FC<CancelDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  const handleConfirm = () => {
    // 🧹 Limpar TUDO relacionado ao draft
    sessionStorage.removeItem('animalDraft');
    sessionStorage.removeItem('animalDraft_timestamp');
    
    // 🧹 Limpar cache de plano (força recarregar na próxima abertura)
    clearPlanCache();
    
    // ⚠️ NÃO logar a desistência (privacidade do usuário)
    // Nunca fazer: logEvent('wizard_cancelled')
    
    onConfirm();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os dados preenchidos serão perdidos e você precisará começar novamente.
            <br />
            <strong>Esta ação não pode ser desfeita.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Continuar editando
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, descartar tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

