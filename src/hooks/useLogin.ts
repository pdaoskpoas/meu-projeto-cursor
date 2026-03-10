import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UseLoginReturn {
  isSubmitting: boolean;
  handleLogin: (email: string, password: string) => Promise<void>;
}

export const useLogin = (): UseLoginReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string): Promise<void> => {
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const loggedUser = await login(email, password);
      
      if (loggedUser) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo${loggedUser.role === 'admin' ? ' ao painel administrativo' : ' ao painel do haras'}.`
        });
        
        // Redirect based on user role
        if (loggedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no sistema",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleLogin
  };
};



