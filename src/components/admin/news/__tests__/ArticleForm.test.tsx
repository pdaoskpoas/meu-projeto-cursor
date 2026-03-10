import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ArticleForm from '../ArticleForm';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const toastMock = vi.fn();

// Mock do toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

// Mock do auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin', name: 'Admin' },
  }),
}));

// Mock do hook
vi.mock('@/hooks/admin/useAdminArticles', () => ({
  useAdminArticles: () => ({
    articles: [],
    isLoading: false,
    error: null,
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn(),
  }),
}));

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
);

describe('ArticleForm', () => {
  beforeEach(() => {
    toastMock.mockClear();
  });
  
  test('renderiza formulário corretamente', () => {
    render(<ArticleForm />, { wrapper: Wrapper });
    
    expect(screen.getByText('Novo Artigo')).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Conteúdo/i)).toBeInTheDocument();
  });

  test('valida campos obrigatórios', async () => {
    render(<ArticleForm />, { wrapper: Wrapper });
    
    const publishButton = screen.getByText(/Publicar Agora/i);
    fireEvent.click(publishButton);
    
    // A validação é exibida via toast.
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Validação',
          description: 'O título é obrigatório.',
          variant: 'destructive',
        })
      );
    });
  });

  test('permite preencher todos os campos', () => {
    render(<ArticleForm />, { wrapper: Wrapper });
    
    const titleInput = screen.getByLabelText(/Título/i);
    const categorySelect = screen.getByLabelText(/Categoria/i);
    
    fireEvent.change(titleInput, { target: { value: 'Meu Artigo Teste' } });
    
    expect(titleInput).toHaveValue('Meu Artigo Teste');
  });

  test('botão de pré-visualização está desabilitado sem conteúdo', () => {
    render(<ArticleForm />, { wrapper: Wrapper });
    
    const previewButton = screen.getByText(/Pré-visualizar/i);
    expect(previewButton).toBeDisabled();
  });
});



