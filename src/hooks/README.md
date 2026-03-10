# Hooks Customizados

Este diretório contém hooks customizados para funcionalidades específicas da aplicação.

## useLogin

Hook para gerenciar o processo de autenticação do usuário.

### Uso

```tsx
import { useLogin } from '@/hooks/useLogin';

const LoginComponent = () => {
  const { isSubmitting, handleLogin } = useLogin();

  const onSubmit = async (email: string, password: string) => {
    await handleLogin(email, password);
  };

  return (
    <form onSubmit={onSubmit}>
      {/* campos do formulário */}
    </form>
  );
};
```

### Retorno

- `isSubmitting: boolean` - Indica se o processo de login está em andamento
- `handleLogin: (email: string, password: string) => Promise<void>` - Função para executar o login

### Funcionalidades

- Validação de campos obrigatórios
- Integração com contexto de autenticação
- Exibição de toasts de feedback
- Redirecionamento automático após login bem-sucedido
- Tratamento de erros com mensagens apropriadas

## useFormValidation

Hook para validação de formulários com regras customizáveis.

### Uso

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';

const FormComponent = () => {
  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value: string) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Por favor, insira um email válido';
        }
        return null;
      }
    },
    password: {
      required: true,
      minLength: 6
    }
  };

  const { errors, validateField, validateForm, clearErrors } = useFormValidation(validationRules);

  const handleSubmit = (formData) => {
    if (validateForm(formData)) {
      // formulário válido, prosseguir
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* campos com validação */}
    </form>
  );
};
```

### Parâmetros

- `rules: ValidationRules` - Objeto com regras de validação para cada campo

### Retorno

- `errors: ValidationErrors` - Objeto com erros de validação por campo
- `validateField: (field: string, value: string) => string | null` - Validação de campo individual
- `validateForm: (data: FormData) => boolean` - Validação de formulário completo
- `clearErrors: () => void` - Limpar todos os erros
- `setError: (field: string, error: string | null) => void` - Definir erro manualmente

### Tipos de Validação

- `required: boolean` - Campo obrigatório
- `minLength: number` - Comprimento mínimo
- `maxLength: number` - Comprimento máximo
- `pattern: RegExp` - Padrão regex
- `custom: (value: string) => string | null` - Validação customizada

### Exemplo de Regras

```tsx
const rules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value) => {
      if (value.includes('test')) {
        return 'Emails de teste não são permitidos';
      }
      return null;
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número';
      }
      return null;
    }
  }
};
```

## Benefícios

### Escalabilidade
- Componentes menores e reutilizáveis
- Lógica de negócio separada da apresentação
- Fácil manutenção e testes

### Manutenibilidade
- Código organizado em módulos específicos
- Responsabilidades bem definidas
- Documentação clara

### Acessibilidade
- Suporte completo a screen readers
- Navegação por teclado
- Mensagens de erro acessíveis
- Indicadores de estado apropriados

### Performance
- Validação otimizada
- Re-renderizações mínimas
- Cleanup automático de recursos



