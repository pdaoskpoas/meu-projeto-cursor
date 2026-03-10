import { useState, useEffect } from 'react';
import { AdminUser } from '@/data/adminData';

// Mock de usuários suspensos (em produção viria do backend)
const suspendedUsers = [
  {
    email: 'lucas@email.com',
    cpf: '369.258.147-00',
    suspensionDate: '2024-06-15',
    suspensionReason: 'Violação das normas da plataforma - tentativa de golpe'
  }
];

export function useSuspensionCheck() {
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState<{
    suspensionDate?: string;
    suspensionReason?: string;
  }>({});

  const checkSuspension = (email: string, cpf?: string) => {
    const suspendedUser = suspendedUsers.find(user => 
      user.email === email || (cpf && user.cpf === cpf)
    );

    if (suspendedUser) {
      setIsSuspended(true);
      setSuspensionInfo({
        suspensionDate: suspendedUser.suspensionDate,
        suspensionReason: suspendedUser.suspensionReason
      });
      return true;
    }

    setIsSuspended(false);
    setSuspensionInfo({});
    return false;
  };

  return {
    isSuspended,
    suspensionInfo,
    checkSuspension
  };
}

// Função para adicionar usuário à lista de suspensos
export function addSuspendedUser(user: AdminUser) {
  const suspendedUser = {
    email: user.email,
    cpf: user.cpf,
    suspensionDate: user.suspensionDate || new Date().toISOString().split('T')[0],
    suspensionReason: user.suspensionReason || 'Suspensão administrativa'
  };

  // Em produção, isso seria uma chamada para o backend
  suspendedUsers.push(suspendedUser);
}

// Função para remover usuário da lista de suspensos
export function removeSuspendedUser(email: string, cpf: string) {
  const index = suspendedUsers.findIndex(user => 
    user.email === email || user.cpf === cpf
  );
  
  if (index > -1) {
    suspendedUsers.splice(index, 1);
  }
}


