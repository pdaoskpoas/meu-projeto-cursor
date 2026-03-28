import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Testes de integracao estatica:
 * Verifica que todos os arquivos modificados usam BackButton,
 * que o componente possui a logica de referrer e navCount,
 * e que o tracker esta integrado ao ScrollRestoration.
 */

const SRC = resolve(__dirname, '../../..');

function readFile(relativePath: string): string {
  return readFileSync(resolve(SRC, relativePath), 'utf-8');
}

// =====================================================
// 1. Todos os arquivos modificados usam BackButton
// =====================================================
describe('Integracao: BackButton nos arquivos modificados', () => {
  const modifiedFiles = [
    { path: 'pages/animal/AnimalPage.tsx', fallback: '/' },
    { path: 'pages/ArticlePage.tsx', fallback: '/noticias' },
    { path: 'pages/HarasPage.tsx', fallback: '/' },
    { path: 'pages/ranking/RankingPage.tsx', fallback: '/' },
    { path: 'pages/ranking/RankingHistoryPage.tsx', fallback: '/' },
    { path: 'pages/EventPage.tsx', fallback: '/eventos' },
    { path: 'pages/events/components/EventDetailsHero.tsx', fallback: '/eventos' },
    { path: 'pages/dashboard/EditAnimalPage.tsx', fallback: '/dashboard/animals' },
    { path: 'pages/dashboard/UpdateProfilePage.tsx', fallback: '/dashboard' },
    { path: 'pages/NewsPage.tsx', fallback: '/' },
  ];

  modifiedFiles.forEach(({ path, fallback }) => {
    describe(path, () => {
      const content = readFile(path);

      test('importa BackButton', () => {
        expect(content).toContain("import BackButton from '@/components/ui/BackButton'");
      });

      test('usa <BackButton com fallbackPath correto', () => {
        expect(content).toContain(`fallbackPath="${fallback}"`);
      });

      test('nao possui <Link> hardcoded com ArrowLeft para navegacao de voltar', () => {
        const hardcodedBackPattern = /<Link[^>]*>\s*<ArrowLeft/;
        expect(hardcodedBackPattern.test(content)).toBe(false);
      });
    });
  });
});

// =====================================================
// 2. Nenhum navigate("/") hardcoded para botoes de voltar
// =====================================================
describe('Nenhum navigate("/") hardcoded para botoes de voltar', () => {
  test('RankingPage nao usa navigate("/") para voltar', () => {
    const content = readFile('pages/ranking/RankingPage.tsx');
    expect(content).not.toMatch(/onClick=\{.*navigate\(['"]\/['"]\)/);
  });

  test('RankingHistoryPage nao usa navigate("/") para voltar', () => {
    const content = readFile('pages/ranking/RankingHistoryPage.tsx');
    expect(content).not.toMatch(/onClick=\{.*navigate\(['"]\/['"]\)/);
  });
});

// =====================================================
// 3. replace: true mantido onde eh legitimo
// =====================================================
describe('replace: true mantido onde eh legitimo', () => {
  test('ArticlePage usa replace:true apenas para canonicalizacao de slug', () => {
    const content = readFile('pages/ArticlePage.tsx');
    const replaceMatches = content.match(/replace:\s*true/g) || [];
    expect(replaceMatches.length).toBe(1);
    expect(content).toContain("navigate(`/noticias/${articleData.slug}`, { replace: true })");
  });

  test('CheckoutPage usa replace:true apenas para redirect de auth', () => {
    const content = readFile('pages/CheckoutPage.tsx');
    expect(content).toContain("navigate('/login', { replace: true })");
  });
});

// =====================================================
// 4. Componente BackButton possui toda a logica exigida
// =====================================================
describe('Componente BackButton — estrutura e logica', () => {
  const content = readFile('components/ui/BackButton.tsx');

  test('usa useNavigate do react-router-dom', () => {
    expect(content).toContain("import { useNavigate } from 'react-router-dom'");
  });

  test('exporta canSafelyGoBack como funcao', () => {
    expect(content).toContain('export function canSafelyGoBack');
  });

  test('exporta incrementInternalNavCount', () => {
    expect(content).toContain('export function incrementInternalNavCount');
  });

  test('exporta _resetInternalNavCount para testes', () => {
    expect(content).toContain('export function _resetInternalNavCount');
  });

  test('verifica window.history.length', () => {
    expect(content).toContain('window.history.length');
  });

  test('verifica internalNavCount (navegacoes SPA)', () => {
    expect(content).toContain('internalNavCount < 1');
  });

  test('verifica document.referrer e compara com window.location.origin', () => {
    expect(content).toContain('document.referrer');
    expect(content).toContain('window.location.origin');
  });

  test('verifica React Router idx no history.state', () => {
    expect(content).toContain('state.idx');
  });

  test('chama navigate(-1) quando canSafelyGoBack retorna true', () => {
    expect(content).toContain('navigate(-1)');
  });

  test('chama navigate(fallbackPath) quando canSafelyGoBack retorna false', () => {
    expect(content).toContain('navigate(fallbackPath)');
  });

  test('exporta como default', () => {
    expect(content).toContain('export default BackButton');
  });

  test('possui 3 variantes: link, ghost, icon', () => {
    expect(content).toContain("variant?: 'link' | 'ghost' | 'icon'");
  });
});

// =====================================================
// 5. ScrollRestoration integra o tracker de navegacao
// =====================================================
describe('ScrollRestoration — integrado com nav tracker', () => {
  const content = readFile('components/ScrollRestoration.tsx');

  test('importa incrementInternalNavCount do BackButton', () => {
    expect(content).toContain("import { incrementInternalNavCount } from '@/components/ui/BackButton'");
  });

  test('chama incrementInternalNavCount quando path muda', () => {
    expect(content).toContain('incrementInternalNavCount()');
  });
});
