import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Buscando artigos agendados...')

    // Buscar artigos agendados que já passaram do horário
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .lte('scheduled_publish_at', new Date().toISOString())
      .eq('is_published', false)
      .not('scheduled_publish_at', 'is', null)

    if (fetchError) {
      console.error('❌ Erro ao buscar artigos:', fetchError)
      throw fetchError
    }

    console.log(`📋 Encontrados ${articles?.length || 0} artigos para publicar`)

    // Publicar cada artigo
    const published = []
    const errors = []

    for (const article of articles || []) {
      console.log(`📰 Publicando artigo: ${article.title}`)

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          scheduled_publish_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id)

      if (updateError) {
        console.error(`❌ Erro ao publicar ${article.title}:`, updateError)
        errors.push({
          id: article.id,
          title: article.title,
          error: updateError.message
        })
      } else {
        console.log(`✅ Artigo publicado: ${article.title}`)
        published.push({
          id: article.id,
          title: article.title,
          slug: article.slug,
          publishedAt: new Date().toISOString()
        })
      }
    }

    const result = {
      success: true,
      totalFound: articles?.length || 0,
      published: published.length,
      errors: errors.length,
      articles: published,
      timestamp: new Date().toISOString()
    }

    if (errors.length > 0) {
      result.errors = errors
    }

    console.log('📊 Resultado:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro fatal:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})



