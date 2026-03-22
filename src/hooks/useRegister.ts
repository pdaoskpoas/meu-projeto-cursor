import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RegisterData {
  name: string;
  accountType: 'personal' | 'institutional';
  propertyName?: string;
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao';
  cep?: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  marketingConsent?: boolean;
}

interface UseRegisterReturn {
  isSubmitting: boolean;
  handleRegister: (data: RegisterData) => Promise<void>;
}

export const useRegister = (): UseRegisterReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (data: RegisterData): Promise<void> => {
    const { name, propertyName, propertyType, cpf, email, phone, password, confirmPassword, accountType } = data;

    // Validações básicas
    if (!name || !cpf || !email || !phone || !password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (accountType === 'institutional' && (!propertyName || !propertyType)) {
      toast({
        title: "Nome da propriedade obrigatório",
        description: "Informe o nome e o tipo da propriedade.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const registerData = {
        name,
        accountType,
        propertyName: accountType === 'institutional' ? propertyName : undefined,
        propertyType: accountType === 'institutional' ? propertyType : undefined,
        cep: accountType === 'institutional' ? data.cep : undefined,
        cpf,
        email,
        phone,
        password,
        marketingConsent: data.marketingConsent ?? false
      };
      
      const success = await register(registerData);
      
      if (success) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao Haras Elite. Redirecionando para o painel..."
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast({
          title: "Erro no cadastro",
          description: "Não foi possível criar a conta. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // handleSupabaseError retorna objeto simples, não Error — tratar ambos
      const message = error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ?? String(error);

      console.error('[useRegister] Registration error:', message);

      let title = "Erro no cadastro";
      let description = message || "Tente novamente em alguns instantes.";

      if (message.includes('Email já cadastrado') || message.includes('already registered')) {
        description = "Este e-mail já está em uso.";
      } else if (message.includes('CPF já cadastrado')) {
        description = "Este CPF já está em uso.";
      } else if (message.toLowerCase().includes('suspenso')) {
        title = "Conta suspensa";
        description = "Usuário suspenso. Entre em contato com o suporte.";
      } else if (message.includes('consentimento')) {
        description = "Falha ao registrar consentimento. Tente novamente.";
      }

      toast({
        title,
        description,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleRegister
  };
};



