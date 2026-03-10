# Componentes de Autenticação

Este diretório contém os componentes reutilizáveis relacionados à autenticação do sistema.

## Componentes

### AuthLayout
Layout base para páginas de autenticação com componentes auxiliares:
- `AuthLayout`: Container principal com layout responsivo
- `AuthCard`: Card estilizado para formulários
- `AuthFooter`: Rodapé padrão para páginas de auth

### BackNavigation
Componente de navegação para voltar à página anterior.

**Props:**
- `to?: string` - URL de destino (padrão: '/')
- `text?: string` - Texto do link (padrão: 'Voltar ao site')
- `className?: string` - Classes CSS adicionais

### Logo
Componente do logo da aplicação com acessibilidade aprimorada.

**Props:**
- `className?: string` - Classes CSS adicionais

### LoginForm
Formulário de login com validação robusta e acessibilidade.

**Props:**
- `onSubmit: (email: string, password: string) => Promise<void>` - Função de callback para submissão
- `isSubmitting: boolean` - Estado de carregamento
- `className?: string` - Classes CSS adicionais

**Características:**
- Validação em tempo real
- Mensagens de erro acessíveis
- Suporte a screen readers
- Indicadores visuais de estado

### DemoCredentials
Componente que exibe credenciais de teste para desenvolvimento.

**Props:**
- `className?: string` - Classes CSS adicionais

## Hooks Relacionados

### useLogin
Hook customizado para gerenciar o processo de login.

**Retorno:**
- `isSubmitting: boolean` - Estado de carregamento
- `handleLogin: (email: string, password: string) => Promise<void>` - Função de login

### useFormValidation
Hook para validação de formulários com regras customizáveis.

**Parâmetros:**
- `rules: ValidationRules` - Regras de validação

**Retorno:**
- `errors: ValidationErrors` - Erros de validação
- `validateField: (field: string, value: string) => string | null` - Validação de campo individual
- `validateForm: (data: FormData) => boolean` - Validação de formulário completo
- `clearErrors: () => void` - Limpar erros
- `setError: (field: string, error: string | null) => void` - Definir erro manualmente

## Acessibilidade

Todos os componentes seguem as diretrizes WCAG 2.1 AA:
- Labels associados aos inputs
- ARIA attributes apropriados
- Suporte a navegação por teclado
- Mensagens de erro anunciadas por screen readers
- Contraste adequado de cores
- Foco visível em elementos interativos

## Uso

```tsx
import AuthLayout, { AuthCard, AuthFooter } from '@/components/auth/AuthLayout';
import BackNavigation from '@/components/auth/BackNavigation';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { useLogin } from '@/hooks/useLogin';

const LoginPage = () => {
  const { isSubmitting, handleLogin } = useLogin();

  return (
    <AuthLayout>
      <BackNavigation />
      <Logo />
      <AuthCard>
        <LoginForm 
          onSubmit={handleLogin}
          isSubmitting={isSubmitting}
        />
      </AuthCard>
      <AuthFooter />
    </AuthLayout>
  );
};
```



