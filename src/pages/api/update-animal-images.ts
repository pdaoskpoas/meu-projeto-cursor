import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { animalId, images } = await req.json()
    if (!animalId || !Array.isArray(images)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }
    const { error } = await supabase.from('animals').update({ images }).eq('id', animalId)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify({ ok: true }))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}





