import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation', () => {
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
      minLength: 6,
      custom: (value: string) => {
        if (value && value.length < 6) {
          return 'A senha deve ter pelo menos 6 caracteres';
        }
        return null;
      }
    },
    name: {
      required: true,
      minLength: 2,
      maxLength: 50
    }
  };

  it('inicializa sem erros', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    expect(result.current.errors).toEqual({});
  });

  it('valida campo individual corretamente', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const error = result.current.validateField('email', '');
      expect(error).toBe('email é obrigatório');
    });

    act(() => {
      const error = result.current.validateField('email', 'invalid-email');
      expect(error).toBe('email tem formato inválido');
    });

    act(() => {
      const error = result.current.validateField('email', 'valid@email.com');
      expect(error).toBeNull();
    });
  });

  it('valida formulário completo', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const isValid = result.current.validateForm({
        email: '',
        password: '',
        name: ''
      });
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.email).toBe('email é obrigatório');
    expect(result.current.errors.password).toBe('password é obrigatório');
    expect(result.current.errors.name).toBe('name é obrigatório');
  });

  it('retorna true para formulário válido', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const isValid = result.current.validateForm({
        email: 'valid@email.com',
        password: 'password123',
        name: 'João Silva'
      });
      expect(isValid).toBe(true);
    });

    expect(result.current.errors).toEqual({});
  });

  it('limpa erros corretamente', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    // Primeiro cria alguns erros
    act(() => {
      result.current.validateForm({
        email: '',
        password: '123',
        name: ''
      });
    });

    expect(Object.keys(result.current.errors)).toHaveLength(3);

    // Depois limpa os erros
    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it('define erro manualmente', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      result.current.setError('email', 'Erro customizado');
    });

    expect(result.current.errors.email).toBe('Erro customizado');

    act(() => {
      result.current.setError('email', null);
    });

    expect(result.current.errors.email).toBeNull();
  });

  it('valida comprimento mínimo', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const error = result.current.validateField('password', '123');
      expect(error).toBe('password deve ter pelo menos 6 caracteres');
    });

    act(() => {
      const error = result.current.validateField('password', '123456');
      expect(error).toBeNull();
    });
  });

  it('valida comprimento máximo', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const error = result.current.validateField('name', 'a'.repeat(51));
      expect(error).toBe('name deve ter no máximo 50 caracteres');
    });

    act(() => {
      const error = result.current.validateField('name', 'João Silva');
      expect(error).toBeNull();
    });
  });

  it('valida padrão regex', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const error = result.current.validateField('email', 'not-an-email');
      expect(error).toBe('email tem formato inválido');
    });

    act(() => {
      const error = result.current.validateField('email', 'valid@email.com');
      expect(error).toBeNull();
    });
  });
});


