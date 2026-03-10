import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useLogin } from '../useLogin';

// Mock user objects
const mockRegularUser = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  accountType: 'personal' as const,
};

const mockAdminUser = {
  id: '456',
  name: 'Admin User',
  email: 'admin@example.com',
  accountType: 'personal' as const,
  role: 'admin' as const,
};

// Mock do contexto de autenticação
const mockLogin = vi.fn();
const mockToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa com estado correto', () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.isSubmitting).toBe(false);
    expect(typeof result.current.handleLogin).toBe('function');
  });

  it('mostra toast de erro para campos vazios', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin('', '');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Campos obrigatórios",
      description: "Por favor, preencha email e senha.",
      variant: "destructive"
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('chama login com credenciais válidas', async () => {
    mockLogin.mockResolvedValue(mockRegularUser);
    
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin('test@example.com', 'password123');
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Login realizado com sucesso!",
      description: "Bem-vindo ao painel do haras."
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('mostra toast de erro para credenciais inválidas', async () => {
    mockLogin.mockResolvedValue(null);
    
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin('invalid@example.com', 'wrongpassword');
    });

    expect(mockLogin).toHaveBeenCalledWith('invalid@example.com', 'wrongpassword');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Erro no login",
      description: "Email ou senha incorretos.",
      variant: "destructive"
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('mostra toast de erro para exceções', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin('test@example.com', 'password123');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Erro no sistema",
      description: "Tente novamente em alguns instantes.",
      variant: "destructive"
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('gerencia estado de loading corretamente', async () => {
    let resolveLogin: (value: typeof mockRegularUser) => void;
    const loginPromise = new Promise<typeof mockRegularUser>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    const { result } = renderHook(() => useLogin());

    // Inicia o login
    act(() => {
      result.current.handleLogin('test@example.com', 'password123');
    });

    // Durante o loading
    expect(result.current.isSubmitting).toBe(true);

    // Resolve o login
    await act(async () => {
      resolveLogin!(mockRegularUser);
      await loginPromise;
    });

    // Após o login
    expect(result.current.isSubmitting).toBe(false);
  });

  it('redireciona admin para /admin', async () => {
    mockLogin.mockResolvedValue(mockAdminUser);
    
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin('admin@example.com', 'password123');
    });

    expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Login realizado com sucesso!",
      description: "Bem-vindo ao painel administrativo."
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });
});