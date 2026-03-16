/**
 * Script para organizar arquivos .md
 * - Mantém apenas documentação essencial na raiz
 * - Move documentação útil para pasta docs/
 * - Remove relatórios temporários e correções já aplicadas
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, renameSync, unlinkSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

// Arquivos ESSENCIAIS que devem ficar na raiz
const essentialFiles = [
  'README.md',
  'DEPLOY_INSTRUCOES.md',
  'LIMPEZA_DADOS_SENSIVEIS_REALIZADA.md',
  'CONFIGURACAO_MAPBOX.md',
  'INSTRUCOES_CHAVE_MAPBOX.md',
  'INTEGRACAO_ASAAS_GUIA_COMPLETO.md',
  'INTEGRACAO_ASAAS_RESUMO_FINAL.md',
  'ASAAS_INICIO_RAPIDO.md',
  'README_SISTEMA_EVENTOS_COTAS_MENSAIS.md',
  'GUIA_SISTEMA_SOCIEDADES_COMPLETO.md',
  'EXECUTAR_AGORA_ADMIN.md',
  'GUIA_RAPIDO_CORRECOES_ADMIN.md',
];

// Padrões de arquivos para DELETAR (relatórios temporários, correções já aplicadas)
const deletePatterns = [
  /^RELATORIO_.*\.md$/i,
  /^CORRECAO_.*\.md$/i,
  /^CORRECOES_.*\.md$/i,
  /^APLICAR_.*\.md$/i,
  /^TESTE_.*\.md$/i,
  /^TEST_.*\.md$/i,
  /^RESUMO_.*\.md$/i,
  /^RESULTADO.*\.md$/i,
  /^RESULTADOS.*\.md$/i,
  /^AUDITORIA_.*\.md$/i,
  /^ANALISE_.*\.md$/i,
  /^DIAGNOSTICO_.*\.md$/i,
  /^DEBUG_.*\.md$/i,
  /^GUIA_TESTE.*\.md$/i,
  /^GUIA_APLICACAO.*\.md$/i,
  /^GUIA_FINAL.*\.md$/i,
  /^GUIA_RAPIDO.*\.md$/i,
  /^IMPLEMENTACAO_.*\.md$/i,
  /^MELHORIA.*\.md$/i,
  /^MELHORIAS_.*\.md$/i,
  /^PROXIMOS_PASSOS.*\.md$/i,
  /^STATUS_.*\.md$/i,
  /^VERIFICACAO_.*\.md$/i,
  /^ULTIMA_.*\.md$/i,
  /^FASE.*\.md$/i,
  /^CHECKLIST.*\.md$/i,
  /^INDICE.*\.md$/i,
  /^LEIA_.*\.md$/i,
  /^PASSO_A_PASSO.*\.md$/i,
  /^PLANO.*\.md$/i,
  /^ROADMAP.*\.md$/i,
  /^ARQUITETURA.*\.md$/i,
  /^REFATORACAO.*\.md$/i,
  /^PROGRESSO.*\.md$/i,
  /^PROBLEMA.*\.md$/i,
  /^SOLUCAO.*\.md$/i,
  /^VALIDACAO.*\.md$/i,
  /^DASHBOARD.*\.md$/i,
  /^SISTEMA_.*\.md$/i,
  /^COMO_.*\.md$/i,
  /^LIMPAR.*\.md$/i,
  /^REMOVER.*\.md$/i,
  /^EXCLUSAO.*\.md$/i,
  /^NOVA_ETAPA.*\.md$/i,
  /^QUICK_START.*\.md$/i,
  /^COMPARACAO.*\.md$/i,
  /^ATUALIZACAO.*\.md$/i,
  /^DIAGRAMA.*\.md$/i,
  /^MAPA_.*\.md$/i,
  /^PRECOS.*\.md$/i,
  /^LIMITES.*\.md$/i,
  /^TUDO_PRONTO.*\.md$/i,
  /^SININHO.*\.md$/i,
  /^README_AUDITORIA.*\.md$/i,
  /^README_IMPORTANTE.*\.md$/i,
  /^CONFIGURAR_.*\.md$/i,
  /^INSPECAO.*\.md$/i,
  /^INSTRUCOES_APLICAR.*\.md$/i,
  /^INSTRUÇÕES.*\.md$/i,
];

// Padrões de arquivos para MOVER para docs/ (documentação útil mas não essencial)
const moveToDocsPatterns = [
  /^GUIA_.*\.md$/i,
  /^README_.*\.md$/i,
];

function shouldDelete(fileName) {
  return deletePatterns.some(pattern => pattern.test(fileName));
}

function shouldMoveToDocs(fileName) {
  if (essentialFiles.includes(fileName)) return false;
  return moveToDocsPatterns.some(pattern => pattern.test(fileName));
}

function isEssential(fileName) {
  return essentialFiles.includes(fileName);
}

function organizeFiles() {
  const rootDir = '.';
  const docsDir = 'docs';
  const deletedFiles = [];
  const movedFiles = [];
  const keptFiles = [];

  // Criar pasta docs/ se não existir
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
    console.log('📁 Pasta docs/ criada\n');
  }

  try {
    const entries = readdirSync(rootDir);
    
    for (const entry of entries) {
      // Apenas processar arquivos .md na raiz
      if (extname(entry) !== '.md') continue;
      
      const filePath = join(rootDir, entry);
      const stat = statSync(filePath);
      
      if (!stat.isFile()) continue;

      const fileName = basename(entry);

      if (isEssential(fileName)) {
        keptFiles.push(fileName);
        console.log(`✅ Mantido: ${fileName}`);
      } else if (shouldDelete(fileName)) {
        try {
          unlinkSync(filePath);
          deletedFiles.push(fileName);
          console.log(`🗑️  Deletado: ${fileName}`);
        } catch (error) {
          console.error(`❌ Erro ao deletar ${fileName}:`, error.message);
        }
      } else if (shouldMoveToDocs(fileName)) {
        try {
          const destPath = join(docsDir, fileName);
          renameSync(filePath, destPath);
          movedFiles.push(fileName);
          console.log(`📦 Movido para docs/: ${fileName}`);
        } catch (error) {
          console.error(`❌ Erro ao mover ${fileName}:`, error.message);
        }
      } else {
        // Arquivos não categorizados - perguntar ou manter
        keptFiles.push(fileName);
        console.log(`⚠️  Não categorizado (mantido): ${fileName}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`✅ Mantidos na raiz: ${keptFiles.length}`);
    console.log(`📦 Movidos para docs/: ${movedFiles.length}`);
    console.log(`🗑️  Deletados: ${deletedFiles.length}`);
    console.log('='.repeat(60));

    if (deletedFiles.length > 0) {
      console.log('\n📋 Arquivos deletados:');
      deletedFiles.slice(0, 20).forEach(f => console.log(`   - ${f}`));
      if (deletedFiles.length > 20) {
        console.log(`   ... e mais ${deletedFiles.length - 20} arquivos`);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar arquivos:', error.message);
  }
}

// Executar
console.log('🧹 Organizando arquivos .md...\n');
organizeFiles();
console.log('\n✅ Organização concluída!');
