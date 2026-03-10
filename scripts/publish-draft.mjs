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

function deriveBirthDateFromAge(ageStr) {
  const age = parseInt(ageStr || '0', 10)
  const year = new Date().getFullYear() - (isNaN(age) ? 3 : age)
  return `${year}-01-01`
}

async function main() {
  const draftId = process.argv[2]
  const email = process.argv[3] || 'haras.mcp2@teste.com.br'
  const password = process.argv[4] || '12345678'
  if (!draftId) throw new Error('Uso: node scripts/publish-draft.mjs <draftId> [email] [senha]')

  const supabase = await getClient()
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr || !auth?.user) throw new Error('Falha ao autenticar usuário')
  const userId = auth.user.id

  const { data: draft, error: draftErr } = await supabase
    .from('animal_drafts')
    .select('*')
    .eq('id', draftId)
    .single()
  if (draftErr || !draft) throw new Error('Rascunho não encontrado')
  if (draft.user_id !== userId) throw new Error('Rascunho não pertence ao usuário autenticado')

  const d = draft.data || {}
  const gender = d.gender === 'Fêmea' ? 'Fêmea' : 'Macho'
  const birth_date = d.birthDate && d.birthDate.length >= 4 ? d.birthDate : deriveBirthDateFromAge(d.age)

  // obter property_name
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('property_name, plan')
    .eq('id', userId)
    .single()
  if (profileErr) throw profileErr

  // calcular status (simples: se plano não for free e não estourou cota, ativa; caso contrário paused)
  let ad_status = 'active'
  const { data: activeCount } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('ad_status', 'active')
  const countActive = (activeCount || []).length || 0
  const allowedByPlan = profile?.plan === 'ultra' ? 30 : profile?.plan === 'pro' || profile?.plan === 'vip' ? 15 : profile?.plan === 'basic' ? 10 : 0
  if (countActive >= allowedByPlan) ad_status = 'paused'

  const now = new Date()
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const insertPayload = {
    name: d.name || 'Sem nome',
    breed: d.breed || 'Mangalarga',
    gender,
    birth_date,
    coat: d.color || null,
    current_city: d.currentCity || null,
    current_state: d.currentState || null,
    owner_id: userId,
    haras_id: userId,
    haras_name: profile?.property_name || null,
    ad_status,
    published_at: now.toISOString(),
    expires_at: expires.toISOString(),
    allow_messages: !!d.allowMessages,
    can_edit: true
  }

  const { data: ins, error: insErr } = await supabase
    .from('animals')
    .insert(insertPayload)
    .select('id')
    .single()
  if (insErr) throw insErr

  // opcional: remover rascunho
  await supabase.from('animal_drafts').delete().eq('id', draftId)

  console.log('[OK] Publicado animal', ins.id, 'a partir do rascunho', draftId)
}

main().catch((e) => { console.error(e); process.exit(1) })







