# Testes dos Componentes de Autenticação

Este diretório contém os testes unitários para os componentes de autenticação.

## Configuração Necessária

Para executar os testes, você precisa instalar as seguintes dependências:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @types/jest jest ts-jest
```

## Configuração do Jest

Crie um arquivo `jest.config.js` na raiz do projeto:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
  ],
};
```

## Arquivo de Setup

Crie um arquivo `src/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';
```

## Scripts de Teste

Adicione ao `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Executando os Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Executar com cobertura
npm run test:coverage
```

## Estrutura dos Testes

### LoginForm.test.tsx
Testa o componente LoginForm com:
- Renderização correta
- Interação com campos de input
- Submissão do formulário
- Estados de carregamento
- Alternância de visibilidade da senha
- Links de navegação
- Credenciais de demo

### Exemplo de Teste

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  it('renderiza corretamente', () => {
    const mockOnSubmit = jest.fn();
    
    renderWithRouter(
      <LoginForm onSubmit={mockOnSubmit} isSubmitting={false} />
    );

    expect(screen.getByText('Faça seu login')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });
});
```

## Benefícios dos Testes

- **Confiabilidade**: Garantem que os componentes funcionam conforme esperado
- **Refatoração Segura**: Permitem mudanças sem quebrar funcionalidades
- **Documentação Viva**: Servem como exemplos de uso dos componentes
- **Detecção Precoce de Bugs**: Identificam problemas antes da produção
- **Cobertura de Casos Edge**: Testam cenários que podem ser esquecidos

## Boas Práticas

1. **Teste o comportamento, não a implementação**
2. **Use queries acessíveis** (getByLabelText, getByRole)
3. **Mock dependências externas**
4. **Teste casos de sucesso e erro**
5. **Mantenha testes simples e focados**
6. **Use nomes descritivos para os testes**



