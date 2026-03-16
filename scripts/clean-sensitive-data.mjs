/**
 * Script para limpar dados sensíveis de arquivos de documentação
 * Substitui credenciais, emails e IDs por placeholders genéricos
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Padrões de substituição
const replacements = [
  // Emails específicos
  { pattern: /adm@gmail\.com/gi, replacement: 'seu_email_admin@exemplo.com' },
  { pattern: /tonho@gmail\.com/gi, replacement: 'usuario_teste@exemplo.com' },
  { pattern: /haras@teste\.com\.br/gi, replacement: 'usuario_teste@exemplo.com' },
  { pattern: /monteiro@gmail\.com/gi, replacement: 'usuario_teste@exemplo.com' },
  { pattern: /testefz@gmail\.com/gi, replacement: 'usuario_teste@exemplo.com' },
  
  // Senhas comuns
  { pattern: /senha: sua_senha_segura_aqui/gi, replacement: 'senha: sua_senha_segura_aqui' },
  { pattern: /password: sua_senha_segura_aqui/gi, replacement: 'password: sua_senha_segura_aqui' },
  { pattern: /password: sua_senha_segura_aqui/gi, replacement: 'Password: sua_senha_segura_aqui' },
  { pattern: /'sua_senha_segura_aqui'/g, replacement: "'sua_senha_segura_aqui'" },
  { pattern: /"sua_senha_segura_aqui"/g, replacement: '"sua_senha_segura_aqui"' },
  { pattern: /`sua_senha_segura_aqui`/g, replacement: '`sua_senha_segura_aqui`' },
  { pattern: /sua_senha_segura_aqui/gi, replacement: 'sua_senha_segura_aqui' },
  
  // IDs de usuários específicos
  { pattern: /USER_ID_EXAMPLE/gi, replacement: 'USER_ID_EXAMPLE' },
  { pattern: /ADMIN_UUID_EXAMPLE/gi, replacement: 'ADMIN_UUID_EXAMPLE' },
  
  // Chaves Supabase expostas (manter apenas estrutura)
  { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 
    replacement: 'your_supabase_anon_key_here' },
  
  // URLs do Supabase (manter apenas estrutura)
  { pattern: /https:\/\/wyufgltprapazpxmtaff\.supabase\.co/g, 
    replacement: 'https://your-project-ref.supabase.co' },
];

// Extensões de arquivos para processar
const extensions = ['.md', '.sql', '.mjs', '.html'];

// Diretórios a ignorar
const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next'];

// Diretórios a processar (raiz e subdiretórios específicos)
const processDirs = ['.', 'scripts'];

function shouldProcessFile(filePath) {
  const ext = extname(filePath);
  return extensions.includes(ext);
}

function shouldIgnoreDir(dirName) {
  return ignoreDirs.includes(dirName);
}

function cleanFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const { pattern, replacement } of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Limpo: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath, basePath = '') {
  const fullPath = join(basePath, dirPath);
  
  try {
    const entries = readdirSync(fullPath);
    
    for (const entry of entries) {
      const entryPath = join(fullPath, entry);
      const stat = statSync(entryPath);
      
      if (stat.isDirectory()) {
        if (!shouldIgnoreDir(entry)) {
          processDirectory(entry, fullPath);
        }
      } else if (stat.isFile() && shouldProcessFile(entry)) {
        // Não processar arquivos em src/ (exceto scripts)
        if (!entryPath.includes('src/') || entryPath.includes('scripts/')) {
          cleanFile(entryPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${fullPath}:`, error.message);
  }
}

// Executar limpeza
console.log('🧹 Iniciando limpeza de dados sensíveis...\n');

for (const dir of processDirs) {
  if (dir === '.') {
    // Processar arquivos na raiz
    try {
      const entries = readdirSync('.');
      for (const entry of entries) {
        const stat = statSync(entry);
        if (stat.isFile() && shouldProcessFile(entry)) {
          cleanFile(entry);
        }
      }
    } catch (error) {
      console.error('Erro ao processar raiz:', error.message);
    }
  } else {
    processDirectory(dir);
  }
}

console.log('\n✅ Limpeza concluída!');
