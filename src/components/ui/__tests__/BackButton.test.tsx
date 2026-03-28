import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BackButton, {
  canSafelyGoBack,
  incrementInternalNavCount,
  _resetInternalNavCount,
} from '../BackButton';

// -------------------------------------------------------
// Mock do react-router-dom navigate
// -------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// -------------------------------------------------------
// Helpers para simular estado do browser
// -------------------------------------------------------
let originalReferrer: PropertyDescriptor | undefined;
let originalHistoryState: PropertyDescriptor | undefined;

function setHistoryLength(len: number) {
  Object.defineProperty(window, 'history', {
    writable: true,
    configurable: true,
    value: { ...window.history, length: len },
  });
}

function setReferrer(url: string) {
  Object.defineProperty(document, 'referrer', {
    writable: true,
    configurable: true,
    value: url,
  });
}

function setHistoryState(state: unknown) {
  Object.defineProperty(window.history, 'state', {
    writable: true,
    configurable: true,
    value: state,
  });
}

function setLocationOrigin(origin: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { ...window.location, origin },
  });
}

// -------------------------------------------------------
// Setup / Teardown
// -------------------------------------------------------
const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');
  originalHistoryState = Object.getOwnPropertyDescriptor(window.history, 'state');
});

afterEach(() => {
  // Restore referrer
  if (originalReferrer) {
    Object.defineProperty(document, 'referrer', originalReferrer);
  } else {
    Object.defineProperty(document, 'referrer', {
      writable: true,
      configurable: true,
      value: '',
    });
  }
  // Restore history.state
  if (originalHistoryState) {
    Object.defineProperty(window.history, 'state', originalHistoryState);
  }
});

// =====================================================
// 1. RENDERIZACAO DAS VARIANTES (sem alteracoes visuais)
// =====================================================
describe('BackButton — renderizacao', () => {
  beforeEach(() => mockNavigate.mockClear());

  test('renderiza variante "link" por padrao com label "Voltar"', () => {
    renderWithRouter(<BackButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

  test('renderiza variante "ghost" com label customizado', () => {
    renderWithRouter(<BackButton variant="ghost" label="Voltar para eventos" />);
    expect(screen.getByText('Voltar para eventos')).toBeInTheDocument();
  });

  test('renderiza variante "icon" com aria-label e sem texto visivel', () => {
    renderWithRouter(<BackButton variant="icon" label="Voltar" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Voltar');
    expect(screen.queryByText('Voltar')).not.toBeInTheDocument();
  });

  test('showLabel=false esconde o texto em variante link', () => {
    renderWithRouter(<BackButton showLabel={false} />);
    expect(screen.queryByText('Voltar')).not.toBeInTheDocument();
  });

  test('aplica className customizada em cada variante', () => {
    const { unmount: u1 } = renderWithRouter(<BackButton className="cls-link" />);
    expect(screen.getByRole('button').className).toContain('cls-link');
    u1();

    const { unmount: u2 } = renderWithRouter(<BackButton variant="ghost" className="cls-ghost" />);
    expect(screen.getByRole('button').className).toContain('cls-ghost');
    u2();

    renderWithRouter(<BackButton variant="icon" className="cls-icon" />);
    expect(screen.getByRole('button').className).toContain('cls-icon');
  });

  test('renderiza icone SVG (ArrowLeft) em todas as variantes', () => {
    const { unmount: u1 } = renderWithRouter(<BackButton variant="link" />);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    u1();

    const { unmount: u2 } = renderWithRouter(<BackButton variant="ghost" />);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    u2();

    renderWithRouter(<BackButton variant="icon" />);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
});

// =====================================================
// 2. canSafelyGoBack — logica pura (unit tests)
// =====================================================
describe('canSafelyGoBack', () => {
  beforeEach(() => {
    _resetInternalNavCount();
    setLocationOrigin('https://cavalaria.com');
  });

  // --- history.length ---

  test('retorna false quando history.length <= 1 (deep link / nova aba)', () => {
    setHistoryLength(1);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false);
  });

  // --- internalNavCount ---

  test('retorna false quando nenhuma navegacao SPA ocorreu (acesso direto)', () => {
    setHistoryLength(5);
    // navCount = 0 — nenhuma navegacao interna
    setReferrer('');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false);
  });

  test('retorna false apos refresh (F5) — navCount reseta para 0', () => {
    // Simula: usuario navegou, deu F5 (navCount volta a 0)
    setHistoryLength(10); // browser mantem history apos refresh
    // _resetInternalNavCount ja foi chamado no beforeEach
    setReferrer('https://cavalaria.com/animal/123');
    setHistoryState({ idx: 3 });
    expect(canSafelyGoBack()).toBe(false);
  });

  // --- referrer externo ---

  test('retorna false quando referrer eh externo (ex: google.com)', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('https://www.google.com/search?q=cavalos');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false);
  });

  test('retorna false quando referrer eh de outro dominio', () => {
    setHistoryLength(3);
    incrementInternalNavCount();
    setReferrer('https://instagram.com/cavalaria');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false);
  });

  test('retorna false quando referrer eh URL invalida', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('not-a-valid-url');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false);
  });

  // --- referrer interno ou vazio ---

  test('retorna true quando referrer eh do mesmo dominio', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('https://cavalaria.com/ranking');
    setHistoryState({ idx: 2 });
    expect(canSafelyGoBack()).toBe(true);
  });

  test('retorna true quando referrer eh vazio (navegacao interna sem referrer)', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ idx: 2 });
    expect(canSafelyGoBack()).toBe(true);
  });

  // --- React Router idx ---

  test('retorna false quando history.state.idx === 0 (primeira entrada do router)', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ idx: 0 });
    expect(canSafelyGoBack()).toBe(false);
  });

  test('retorna true quando history.state.idx > 0', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ idx: 3 });
    expect(canSafelyGoBack()).toBe(true);
  });

  test('retorna true quando history.state nao tem idx (state nulo)', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState(null);
    expect(canSafelyGoBack()).toBe(true);
  });

  test('retorna true quando history.state nao tem idx (state sem campo)', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ key: 'abc' });
    expect(canSafelyGoBack()).toBe(true);
  });

  // --- Cenarios combinados de producao ---

  test('cenario: usuario abriu link do WhatsApp (deep link, externo)', () => {
    setHistoryLength(1);
    // navCount = 0
    setReferrer('');
    setHistoryState({ idx: 0 });
    expect(canSafelyGoBack()).toBe(false);
  });

  test('cenario: usuario veio do Google, navegou internamente', () => {
    setHistoryLength(5);
    incrementInternalNavCount(); // 1a nav interna
    incrementInternalNavCount(); // 2a nav interna
    // Referrer ainda e do Google (nao muda apos SPA navs)
    setReferrer('https://www.google.com/');
    setHistoryState({ idx: 2 });
    // Referrer externo => false (protecao conservadora)
    expect(canSafelyGoBack()).toBe(false);
  });

  test('cenario: navegacao SPA normal (home -> ranking -> animal)', () => {
    setHistoryLength(3);
    incrementInternalNavCount(); // home -> ranking
    incrementInternalNavCount(); // ranking -> animal
    setReferrer('https://cavalaria.com/ranking');
    setHistoryState({ idx: 2 });
    expect(canSafelyGoBack()).toBe(true);
  });

  test('cenario: usuario digitou URL direto no browser', () => {
    setHistoryLength(1);
    // navCount = 0
    setReferrer('');
    setHistoryState({ idx: 0 });
    expect(canSafelyGoBack()).toBe(false);
  });
});

// =====================================================
// 3. incrementInternalNavCount / _resetInternalNavCount
// =====================================================
describe('internalNavCount tracker', () => {
  beforeEach(() => _resetInternalNavCount());

  test('inicia em 0', () => {
    // canSafelyGoBack depende de navCount >= 1
    setHistoryLength(5);
    setReferrer('');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false); // navCount === 0
  });

  test('incrementa corretamente', () => {
    setHistoryLength(5);
    setReferrer('');
    setHistoryState({ idx: 1 });
    setLocationOrigin('http://localhost');

    incrementInternalNavCount();
    expect(canSafelyGoBack()).toBe(true); // navCount === 1

    incrementInternalNavCount();
    expect(canSafelyGoBack()).toBe(true); // navCount === 2
  });

  test('_resetInternalNavCount reseta para 0', () => {
    incrementInternalNavCount();
    incrementInternalNavCount();
    _resetInternalNavCount();

    setHistoryLength(5);
    setReferrer('');
    setHistoryState({ idx: 1 });
    expect(canSafelyGoBack()).toBe(false); // navCount === 0
  });
});

// =====================================================
// 4. handleBack — integracao click -> navigate
// =====================================================
describe('BackButton — handleBack integracao', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    _resetInternalNavCount();
    setLocationOrigin('https://cavalaria.com');
  });

  test('navigate(-1) quando todas condicoes sao atendidas', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('https://cavalaria.com/ranking');
    setHistoryState({ idx: 2 });

    renderWithRouter(<BackButton fallbackPath="/home" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockNavigate).not.toHaveBeenCalledWith('/home');
  });

  test('fallbackPath quando deep link (navCount=0, history=1)', () => {
    setHistoryLength(1);
    setReferrer('');
    setHistoryState({ idx: 0 });

    renderWithRouter(<BackButton fallbackPath="/eventos" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/eventos');
    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
  });

  test('fallbackPath quando referrer externo (Google)', () => {
    setHistoryLength(5);
    incrementInternalNavCount();
    setReferrer('https://www.google.com/');
    setHistoryState({ idx: 1 });

    renderWithRouter(<BackButton fallbackPath="/noticias" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/noticias');
  });

  test('fallbackPath quando refresh (F5) — navCount resetou', () => {
    setHistoryLength(10); // browser mantem history
    // navCount = 0 (resetado pelo refresh)
    setReferrer('https://cavalaria.com/animal/1');
    setHistoryState({ idx: 3 });

    renderWithRouter(<BackButton fallbackPath="/" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('fallbackPath quando history.state.idx === 0', () => {
    setHistoryLength(2);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ idx: 0 });

    renderWithRouter(<BackButton fallbackPath="/dashboard" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('fallback padrao eh "/" quando nao especificado', () => {
    setHistoryLength(1);
    setReferrer('');
    setHistoryState({ idx: 0 });

    renderWithRouter(<BackButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // --- variantes ghost e icon ---

  test('variante ghost usa navigate(-1) quando seguro', () => {
    setHistoryLength(3);
    incrementInternalNavCount();
    setReferrer('');
    setHistoryState({ idx: 1 });

    renderWithRouter(<BackButton variant="ghost" fallbackPath="/noticias" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('variante icon usa fallback quando nao seguro', () => {
    setHistoryLength(1);
    setReferrer('');
    setHistoryState({ idx: 0 });

    renderWithRouter(<BackButton variant="icon" fallbackPath="/dashboard" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});

// =====================================================
// 5. Fallbacks especificos por pagina do sistema
// =====================================================
describe('BackButton — fallbacks por pagina', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    _resetInternalNavCount();
    setHistoryLength(1);
    setReferrer('');
    setHistoryState({ idx: 0 });
  });

  const pages = [
    { name: 'AnimalPage', fallback: '/' },
    { name: 'HarasPage', fallback: '/' },
    { name: 'RankingPage', fallback: '/' },
    { name: 'NewsPage', fallback: '/' },
    { name: 'ArticlePage', fallback: '/noticias' },
    { name: 'EventPage', fallback: '/eventos' },
    { name: 'EventDetailsHero', fallback: '/eventos' },
    { name: 'EditAnimalPage', fallback: '/dashboard/animals' },
    { name: 'UpdateProfilePage', fallback: '/dashboard' },
  ];

  pages.forEach(({ name, fallback }) => {
    test(`${name} — fallback para "${fallback}" em deep link`, () => {
      renderWithRouter(<BackButton fallbackPath={fallback} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith(fallback);
    });
  });
});
