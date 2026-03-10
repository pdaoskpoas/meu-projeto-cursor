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
  const anon = env['VITE_SUPABASE_ANON_KEY']
  if (!url || !anon) {
    throw new Error('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes no .env.local')
  }

  const supabase = createClient(url, anon)
  const { data, error } = await supabase.from('profiles').select('id').limit(1)
  if (error) {
    console.error('Falha ao consultar Supabase:', error)
    process.exit(1)
  }
  console.log('Conexão Supabase OK. Linhas retornadas:', Array.isArray(data) ? data.length : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })







