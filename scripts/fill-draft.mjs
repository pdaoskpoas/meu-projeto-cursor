import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const path = '.env.local'
  if (!fs.existsSync(path)) throw new Error('.env.local não encontrado')
  const content = fs.readFileSync(path, 'utf8')
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

async function getClient() {
  const env = loadEnvLocal()
  const url = env['VITE_SUPABASE_URL']
  const anon = env['VITE_SUPABASE_ANON_KEY']
  if (!url || !anon) throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes')
  return createClient(url, anon)
}

async function main() {
  const email = process.argv[2] || 'haras.mcp2@teste.com.br'
  const password = process.argv[3] || '12345678'
  const supabase = await getClient()

  // login
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr || !auth?.user) throw new Error('Falha ao autenticar usuário de teste')
  const userId = auth.user.id

  // obter último rascunho
  const { data: drafts, error: listErr } = await supabase
    .from('animal_drafts')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
  if (listErr) throw listErr
  if (!drafts || drafts.length === 0) throw new Error('Nenhum rascunho encontrado para este usuário')
  const draftId = drafts[0].id

  // dados completos simulando preenchimento do modal
  const data = {
    name: 'Estrela do Campo MCP',
    breed: 'Mangalarga Marchador',
    gender: 'Macho',
    color: 'Castanho',
    age: '5',
    birthDate: '',
    currentCity: 'Campinas',
    currentState: 'SP',
    isRegistered: true,
    registrationNumber: 'ABCCRM 12345-XYZ',
    father: 'Vento do Vale',
    mother: 'Aurora da Serra',
    paternalGrandfather: 'Raio de Prata',
    paternalGrandmother: 'Lua Cheia',
    maternalGrandfather: 'Astro Rei',
    maternalGrandmother: 'Flor do Campo',
    paternalGreatGrandfather: 'Nobreza',
    paternalGreatGrandmother: 'Dama Real',
    paternalGreatGrandfather2: 'Herói',
    paternalGreatGrandmother2: 'Rainha',
    maternalGreatGrandfather: 'Soberano',
    maternalGreatGrandmother: 'Imperatriz',
    maternalGreatGrandfather2: 'Príncipe',
    maternalGreatGrandmother2: 'Duquesa',
    titles: ['Campeão Regional 2023'],
    description: 'Animal manso, excelente marcha, pedigree destacado.',
    allowMessages: true,
    photos: []
  }

  const { error: updErr } = await supabase
    .from('animal_drafts')
    .update({ data })
    .eq('id', draftId)
  if (updErr) throw updErr

  console.log('[OK] Rascunho atualizado:', draftId)
}

main().catch((e) => { console.error(e); process.exit(1) })







