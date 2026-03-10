import fs from 'node:fs'
import process from 'node:process'
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

async function getClient() {
  const env = loadEnvLocal()
  const url = env['VITE_SUPABASE_URL']
  const anon = env['VITE_SUPABASE_ANON_KEY']
  if (!url || !anon) throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes')
  return createClient(url, anon)
}

async function signInOrFail(supabase, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data?.user) throw new Error('Falha ao autenticar: usuário não retornado')
  return data.user
}

async function upsertProfileAsSelf(supabase, userId, updates) {
  // Atualiza os campos permitidos pela RLS do próprio perfil
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) return { ok: false, error }
  return { ok: true }
}

function buildAnimals(ownerId, harasName, count = 10) {
  const animals = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    const published = new Date(now.getTime())
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    animals.push({
      name: `Animal MCP ${i}`,
      breed: i % 3 === 0 ? 'Quarter Horse' : i % 2 === 0 ? 'Thoroughbred' : 'Mangalarga',
      gender: i % 2 === 0 ? 'Macho' : 'Fêmea',
      birth_date: new Date(now.getFullYear() - (2 + i), 0, 1).toISOString().slice(0, 10),
      coat: 'castanho',
      owner_id: ownerId,
      haras_id: ownerId,
      haras_name: harasName,
      current_city: 'São Paulo',
      current_state: 'SP',
      ad_status: 'active',
      published_at: published.toISOString(),
      expires_at: expires.toISOString(),
      is_boosted: false,
      can_edit: true,
      allow_messages: true,
    })
  }
  return animals
}

function buildEvents(organizerId, count = 2) {
  const events = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    events.push({
      title: `Evento MCP ${i}`,
      description: `Evento de teste MCP ${i}`,
      event_type: 'exposicao',
      start_date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      location: 'São Paulo Expo',
      city: 'São Paulo',
      state: 'SP',
      organizer_id: organizerId,
      ad_status: 'active',
      published_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      can_edit: true,
    })
  }
  return events
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const propertyNameArg = process.argv[4]
  if (!email || !password) {
    console.error('Uso: node scripts/seed-user-data.mjs <email> <senha> [nome_propriedade]')
    process.exit(2)
  }

  const supabase = await getClient()
  const user = await signInOrFail(supabase, email, password)

  const propertyName = propertyNameArg || 'Haras Automação MCP'

  // Tenta promover perfil para institucional/haras plano pro
  const profileUpdate = await upsertProfileAsSelf(supabase, user.id, {
    account_type: 'institutional',
    property_name: propertyName,
    property_type: 'haras',
    plan: 'pro',
    plan_purchased_at: new Date().toISOString(),
    plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_annual_plan: false,
  })
  if (!profileUpdate.ok) {
    console.warn('Aviso: não foi possível atualizar o perfil (pode estar protegido por RLS):', profileUpdate.error?.message)
  }

  // Insere 10 animais
  const animals = buildAnimals(user.id, propertyName, 10)
  const { error: animalsErr } = await supabase.from('animals').insert(animals)
  if (animalsErr) throw animalsErr

  // Insere 2 eventos
  const events = buildEvents(user.id, 2)
  const { error: eventsErr } = await supabase.from('events').insert(events)
  if (eventsErr) throw eventsErr

  // Valida contagens
  const { data: animalsCountData } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  const { data: eventsCountData } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('organizer_id', user.id)

  console.log('[OK] Seed concluído para', email)
  console.log('Animais inseridos:', animalsCountData?.length ?? 'OK (head request)')
  console.log('Eventos inseridos:', eventsCountData?.length ?? 'OK (head request)')
}

main().catch((e) => { console.error(e); process.exit(1) })


