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

async function getClient() {
  const env = loadEnvLocal()
  const url = env['VITE_SUPABASE_URL']
  const anon = env['VITE_SUPABASE_ANON_KEY']
  if (!url || !anon) throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes')
  return createClient(url, anon)
}

async function ensureAuthUser(supabase, email, password) {
  // Tenta login; se falhar, faz signup
  const signIn = await supabase.auth.signInWithPassword({ email, password })
  if (signIn.data?.user) return signIn.data.user
  const signUp = await supabase.auth.signUp({ email, password })
  if (signUp.error) throw signUp.error
  return signUp.data.user
}

async function ensureProfile(supabase, user, profileData) {
  const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  if (data) return user.id
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    name: profileData.name,
    email: user.email,
    account_type: 'institutional',
    property_name: profileData.property_name,
    property_type: 'haras',
    property_id: user.id,
    public_code: profileData.public_code || null,
    plan: 'pro',
    role: 'user'
  })
  if (error) throw error
  return user.id
}

function randomBreed() {
  const arr = ['Mangalarga', 'Thoroughbred', 'Quarter Horse']
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomGender(i) {
  return i % 2 === 0 ? 'Macho' : 'Fêmea'
}

async function seedAnimals(supabase, ownerId, count = 10) {
  const animals = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    const published = new Date(now.getTime())
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    animals.push({
      name: `Animal ${i}`,
      breed: randomBreed(),
      gender: randomGender(i),
      birth_date: new Date(now.getFullYear() - (2 + i), 0, 1).toISOString().slice(0, 10),
      coat: 'Castanho',
      owner_id: ownerId,
      haras_id: ownerId,
      haras_name: 'Haras Teste',
      current_city: 'São Paulo',
      current_state: 'SP',
      ad_status: 'active',
      published_at: published.toISOString(),
      expires_at: expires.toISOString(),
      is_boosted: false,
      can_edit: true
    })
  }
  // Inserir em lotes
  const { error } = await supabase.from('animals').insert(animals)
  if (error) throw error
}

async function seedEvents(supabase, organizerId, count = 2) {
  const events = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    events.push({
      title: `Evento ${i}`,
      description: `Descrição do evento ${i}`,
      event_type: 'competicao',
      start_date: new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: null,
      location: 'Haras Teste',
      city: 'São Paulo',
      state: 'SP',
      organizer_id: organizerId,
      ad_status: 'active',
      published_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      can_edit: true
    })
  }
  const { error } = await supabase.from('events').insert(events)
  if (error) throw error
}

async function main() {
  const supabase = await getClient()
  const email = 'usuario_teste@exemplo.com'
  const password = '123456'
  const user = await ensureAuthUser(supabase, email, password)
  if (!user) throw new Error('Falha ao criar/autenticar usuário')

  // Gerar código público no servidor
  const { data: publicCode, error: codeErr } = await supabase.rpc('generate_public_code', {
    user_id_param: user.id,
    account_type_param: 'institutional'
  })
  if (codeErr) throw codeErr

  await ensureProfile(supabase, user, {
    name: 'Haras Teste',
    property_name: 'Haras Teste',
    public_code: publicCode
  })

  await seedAnimals(supabase, user.id, 10)
  await seedEvents(supabase, user.id, 2)

  console.log('Seed concluído. Usuário:', email)
}

main().catch((e) => { console.error(e); process.exit(1) })







