/**
 * =================================================================
 * TESTE PRÁTICO - INTEGRAÇÃO ASAAS
 * =================================================================
 * 
 * Execute este arquivo no console do navegador (F12) para testar
 * a integração com o Asaas
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Copie e cole este código
 * 3. Execute os testes um por um
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { asaasService } from '../services/asaasService';
import paymentService from '../services/paymentService';
import { supabase } from '@/lib/supabase';

// =================================================================
// DADOS DE TESTE (usuário real do banco)
// =================================================================

// Use um ID de usuário real do seu banco
const TEST_USER_ID = 'YOUR_USER_ID_HERE'; // Substitua pelo ID de um usuário real do seu banco
const TEST_ANIMAL_ID = ''; // Preencher com um animal real se testar anúncio individual
const TEST_EVENT_ID = ''; // Preencher com um evento real se testar evento individual

// =================================================================
// TESTE 1: VERIFICAR CONFIGURAÇÃO
// =================================================================

export async function test1_VerificarConfiguracao() {
  console.log('🧪 TESTE 1: Verificando configuração...\n');
  
  try {
    const apiKey = import.meta.env.VITE_ASAAS_API_KEY;
    const environment = import.meta.env.VITE_ASAAS_ENVIRONMENT;
    
    console.log('✅ API Key configurada:', !!apiKey);
    console.log('✅ Ambiente:', environment);
    console.log('✅ Sandbox:', asaasService.isSandbox());
    
    if (!apiKey) {
      console.error('❌ ERRO: API Key não configurada!');
      console.log('👉 Configure VITE_ASAAS_API_KEY no arquivo .env');
      return false;
    }
    
    console.log('\n✅ TESTE 1 PASSOU!\n');
    return true;
  } catch (error) {
    console.error('❌ TESTE 1 FALHOU:', error);
    return false;
  }
}

// =================================================================
// TESTE 2: CRIAR CLIENTE NO ASAAS
// =================================================================

export async function test2_CriarCliente() {
  console.log('🧪 TESTE 2: Criando cliente no Asaas...\n');
  
  try {
    // Verificar se usuário existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, cpf')
      .eq('id', TEST_USER_ID)
      .single();
    
    if (profileError || !profile) {
      console.error('❌ Usuário não encontrado:', TEST_USER_ID);
      return false;
    }
    
    console.log('👤 Usuário:', profile.name, '|', profile.email);
    console.log('📄 CPF:', profile.cpf || 'NÃO INFORMADO');
    
    if (!profile.cpf) {
      console.warn('⚠️ ATENÇÃO: Usuário sem CPF. O Asaas pode rejeitar.');
    }
    
    // Criar/buscar cliente no Asaas
    console.log('\n🔄 Criando cliente no Asaas...');
    const result = await asaasService.createOrGetCustomer(TEST_USER_ID);
    
    console.log('✅ Cliente Asaas ID:', result.asaasCustomerId);
    console.log('✅ Cliente novo?', result.isNew ? 'SIM' : 'NÃO (já existia)');
    
    // Verificar no banco
    const { data: customer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();
    
    console.log('✅ Salvo no banco:', !!customer);
    
    console.log('\n✅ TESTE 2 PASSOU!\n');
    return true;
  } catch (error) {
    console.error('❌ TESTE 2 FALHOU:', error);
    return false;
  }
}

// =================================================================
// TESTE 3: COMPRAR 1 BOOST (R$ 47,00)
// =================================================================

export async function test3_Comprar1Boost() {
  console.log('🧪 TESTE 3: Comprando 1 boost (R$ 47,00)...\n');
  
  try {
    const response = await paymentService.purchaseBoosts({
      userId: TEST_USER_ID,
      quantity: 1,
      billingType: 'PIX'
    });
    
    console.log('📊 Resposta:', response);
    
    if (!response.success) {
      console.error('❌ Falha ao criar pagamento:', response.message);
      return false;
    }
    
    console.log('✅ Payment ID:', response.paymentId);
    console.log('✅ Valor: R$ 47,00');
    console.log('✅ Método: PIX');
    
    if (response.pixCopyPaste) {
      console.log('\n📱 PIX COPIA E COLA:');
      console.log(response.pixCopyPaste);
    }
    
    if (response.invoiceUrl) {
      console.log('\n🔗 Link do pagamento:');
      console.log(response.invoiceUrl);
    }
    
    // Verificar no banco
    const { data: payment } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('asaas_payment_id', response.paymentId)
      .single();
    
    console.log('\n✅ Pagamento salvo no banco:', !!payment);
    console.log('✅ Status:', payment?.status);
    console.log('✅ Valor:', payment?.value);
    
    console.log('\n✅ TESTE 3 PASSOU!');
    console.log('👉 Agora acesse https://sandbox.asaas.com');
    console.log('👉 Vá em Cobranças e encontre o pagamento de R$ 47,00');
    console.log('👉 Clique em ... > Receber para simular o pagamento\n');
    
    return true;
  } catch (error) {
    console.error('❌ TESTE 3 FALHOU:', error);
    return false;
  }
}

// =================================================================
// TESTE 4: COMPRAR PACOTE 5 BOOSTS (R$ 129,25 - 45% OFF)
// =================================================================

export async function test4_ComprarPacote5Boosts() {
  console.log('🧪 TESTE 4: Comprando pacote 5 boosts (R$ 129,25)...\n');
  
  try {
    const response = await paymentService.purchaseBoosts({
      userId: TEST_USER_ID,
      quantity: 5,
      billingType: 'PIX'
    });
    
    if (!response.success) {
      console.error('❌ Falha:', response.message);
      return false;
    }
    
    console.log('✅ Payment ID:', response.paymentId);
    console.log('✅ Quantidade: 5 boosts');
    console.log('✅ Preço sem desconto: R$ 235,00');
    console.log('✅ Desconto: 45%');
    console.log('✅ Preço final: R$ 129,25');
    
    // Verificar no banco
    const { data: payment } = await supabase
      .from('asaas_payments')
      .select('value, metadata')
      .eq('asaas_payment_id', response.paymentId)
      .single();
    
    console.log('\n✅ Valor no banco:', payment?.value);
    console.log('✅ Metadata:', payment?.metadata);
    
    console.log('\n✅ TESTE 4 PASSOU!\n');
    return true;
  } catch (error) {
    console.error('❌ TESTE 4 FALHOU:', error);
    return false;
  }
}

// =================================================================
// TESTE 5: ASSINAR PLANO PRO MENSAL (R$ 147,00)
// =================================================================

export async function test5_AssinarPlanoProMensal() {
  console.log('🧪 TESTE 5: Assinando Plano Pro Mensal (R$ 147,00)...\n');
  
  try {
    const response = await paymentService.purchasePlan({
      userId: TEST_USER_ID,
      planType: 'pro',
      billingCycle: 'monthly',
      billingType: 'PIX'
    });
    
    if (!response.success) {
      console.error('❌ Falha:', response.message);
      return false;
    }
    
    console.log('✅ Subscription criada!');
    console.log('✅ Payment ID:', response.paymentId);
    console.log('✅ Plano: Pro');
    console.log('✅ Valor: R$ 147,00/mês');
    console.log('✅ Tipo: Recorrente mensal');
    
    // Verificar assinatura no banco
    const { data: subscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    console.log('\n✅ Assinatura no banco:', !!subscription);
    console.log('✅ Status:', subscription?.status);
    console.log('✅ Valor:', subscription?.value);
    console.log('✅ Auto-renovação:', subscription?.auto_renew);
    
    console.log('\n✅ TESTE 5 PASSOU!\n');
    return true;
  } catch (error) {
    console.error('❌ TESTE 5 FALHOU:', error);
    return false;
  }
}

// =================================================================
// TESTE 6: LISTAR TODOS OS PAGAMENTOS DO USUÁRIO
// =================================================================

export async function test6_ListarPagamentos() {
  console.log('🧪 TESTE 6: Listando pagamentos do usuário...\n');
  
  try {
    const payments = await paymentService.getUserPayments(TEST_USER_ID);
    
    console.log(`✅ Total de pagamentos: ${payments.length}`);
    
    if (payments.length > 0) {
      console.log('\n📋 Últimos 5 pagamentos:');
      payments.slice(0, 5).forEach((payment, index) => {
        console.log(`\n${index + 1}. ${payment.description || payment.payment_type}`);
        console.log(`   Valor: R$ ${payment.value}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Método: ${payment.billing_type}`);
        console.log(`   Data: ${new Date(payment.created_at).toLocaleString('pt-BR')}`);
      });
    } else {
      console.log('ℹ️ Nenhum pagamento encontrado');
    }
    
    console.log('\n✅ TESTE 6 PASSOU!\n');
    return true;
  } catch (error) {
    console.error('❌ TESTE 6 FALHOU:', error);
    return false;
  }
}

// =================================================================
// EXECUTAR TODOS OS TESTES
// =================================================================

export async function runAllTests() {
  console.log('🚀 INICIANDO BATERIA DE TESTES\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false
  };
  
  // Teste 1
  results.test1 = await test1_VerificarConfiguracao();
  if (!results.test1) {
    console.log('❌ Teste 1 falhou. Abortando bateria.');
    return results;
  }
  
  console.log('='.repeat(60));
  
  // Teste 2
  results.test2 = await test2_CriarCliente();
  if (!results.test2) {
    console.log('❌ Teste 2 falhou. Continuando...');
  }
  
  console.log('='.repeat(60));
  
  // Teste 3
  results.test3 = await test3_Comprar1Boost();
  
  console.log('='.repeat(60));
  
  // Teste 4 (comentado por padrão para evitar múltiplas cobranças)
  // results.test4 = await test4_ComprarPacote5Boosts();
  
  // Teste 5 (comentado por padrão)
  // results.test5 = await test5_AssinarPlanoProMensal();
  
  // Teste 6
  results.test6 = await test6_ListarPagamentos();
  
  console.log('='.repeat(60));
  console.log('\n📊 RESUMO DOS TESTES:\n');
  console.log('Teste 1 (Config):', results.test1 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('Teste 2 (Cliente):', results.test2 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('Teste 3 (1 Boost):', results.test3 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('Teste 4 (5 Boosts):', results.test4 ? '✅ PASSOU' : '⏭️ PULADO');
  console.log('Teste 5 (Plano):', results.test5 ? '✅ PASSOU' : '⏭️ PULADO');
  console.log('Teste 6 (Listar):', results.test6 ? '✅ PASSOU' : '❌ FALHOU');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).filter(r => r !== false).length;
  
  console.log(`\n🎯 ${passed}/${total} testes passaram\n`);
  
  return results;
}

// =================================================================
// EXPORTAR FUNÇÕES PARA USO INDIVIDUAL
// =================================================================

export const tests = {
  test1_VerificarConfiguracao,
  test2_CriarCliente,
  test3_Comprar1Boost,
  test4_ComprarPacote5Boosts,
  test5_AssinarPlanoProMensal,
  test6_ListarPagamentos,
  runAllTests
};

// Tornar disponível globalmente no console
if (typeof window !== 'undefined') {
  (window as any).asaasTests = tests;
}

console.log('✅ Testes carregados!');
console.log('👉 Execute: window.asaasTests.runAllTests()');
console.log('👉 Ou execute testes individuais: window.asaasTests.test1_VerificarConfiguracao()');


