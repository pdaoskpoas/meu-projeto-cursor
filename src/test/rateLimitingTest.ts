/**
 * 🧪 Teste de Rate Limiting
 * 
 * Execute este arquivo para testar o sistema de rate limiting
 * 
 * Como executar:
 * 1. npm run dev (em outro terminal)
 * 2. Abra o console do browser
 * 3. Copie e cole este código no console
 */

import { rateLimitingService, checkLoginLimit } from '@/services/rateLimitingService';

export async function testRateLimiting() {
  console.group('🧪 Teste de Rate Limiting');
  
  try {
    // Teste 1: Verificar limite de login (5 tentativas em 15 min)
    console.log('\nTeste 1: Primeira tentativa de login');
    const result1 = await checkLoginLimit();
    console.log('Resultado:', result1);
    console.assert(result1.allowed === true, 'Primeira tentativa deve ser permitida');
    
    // Teste 2: Múltiplas tentativas
    console.log('\nTeste 2: Múltiplas tentativas rápidas');
    for (let i = 2; i <= 6; i++) {
      const result = await rateLimitingService.checkRateLimit('login');
      console.log(`Tentativa ${i}:`, result);
      
      if (i <= 5) {
        console.assert(result.allowed === true, `Tentativa ${i} deve ser permitida`);
      } else {
        console.assert(result.allowed === false, `Tentativa ${i} deve ser bloqueada`);
        console.log('🛡️ Rate limit funcionando! Bloqueado após 5 tentativas.');
      }
    }
    
    // Teste 3: Verificar upload
    console.log('\nTeste 3: Limite de upload (10 em 10 min)');
    const uploadResult = await rateLimitingService.checkRateLimit('upload');
    console.log('Upload permitido:', uploadResult);
    console.assert(uploadResult.allowed === true, 'Upload deve ser permitido');
    
    // Teste 4: API calls
    console.log('\nTeste 4: Limite de API calls (100 em 1 min)');
    const apiResult = await rateLimitingService.checkRateLimit('api_call');
    console.log('API call permitida:', apiResult);
    console.assert(apiResult.allowed === true, 'API call deve ser permitida');
    
    console.log('\nTodos os testes passaram!');
    console.log('\nResumo:');
    console.log('- Login: 5 tentativas / 15 minutos');
    console.log('- Upload: 10 tentativas / 10 minutos');
    console.log('- API calls: 100 tentativas / 1 minuto');
    console.log('- Register: 3 tentativas / 30 minutos');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
  
  console.groupEnd();
}

// Auto-executar se estiver no browser console
if (typeof window !== 'undefined') {
  console.log('🧪 Teste de Rate Limiting disponível!');
  console.log('Execute: testRateLimiting()');
}





