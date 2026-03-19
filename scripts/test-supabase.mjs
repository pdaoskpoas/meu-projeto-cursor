import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const path = '.env.local'
  if (!fs.existsSync(path)) {
    throw new Error('.env.local não encontrado')
  }
  const content = fs.readFileSync(path, 'utf8')
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

async function main() {
  const env = loadEnvLocal()
  const url = env['VITE_SUPABASE_URL']
  
  // ✅ Para scripts, podemos usar SERVICE_ROLE_KEY (mais poderoso) ou ANON_KEY
  // SERVICE_ROLE_KEY permite bypass de RLS (útil para scripts administrativos)
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']
  const anonKey = env['VITE_SUPABASE_ANON_KEY']
  
  if (!url) {
    throw new Error('VITE_SUPABASE_URL ausente no .env.local')
  }
  
  // Preferir SERVICE_ROLE_KEY se disponível, senão usar ANON_KEY
  const key = serviceKey || anonKey
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY ausente no .env.local')
  }
  
  const keyType = serviceKey ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'
  console.log(`🔵 Testando conexão com ${keyType}...`)
  
  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('profiles').select('id').limit(1)
  
  if (error) {
    console.error('❌ Falha ao consultar Supabase:', error)
    process.exit(1)
  }
  
  console.log('✅ Conexão Supabase OK!')
  console.log(`   Tipo de chave: ${keyType}`)
  console.log(`   Linhas retornadas: ${Array.isArray(data) ? data.length : 0}`)
  
  if (serviceKey) {
    console.log('   ⚠️  Usando SERVICE_ROLE_KEY (bypass de RLS)')
  } else {
    console.log('   ℹ️  Usando ANON_KEY (respeita RLS)')
    console.log('   💡 Dica: Adicione SUPABASE_SERVICE_ROLE_KEY para scripts administrativos')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })







