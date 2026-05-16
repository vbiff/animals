import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const url = new URL(req.url)
  const action = url.searchParams.get('action') ?? (await req.json().catch(() => ({}))).action

  async function validateToken(token: string) {
    const { data, error } = await supabase
      .from('vet_sessions')
      .select('*, pets(*), vaccines(*), symptoms(*), medications(*), documents(*)')
      .eq('token', token)
      .single()
    if (error || !data) return null
    if (new Date(data.expires_at) < new Date()) return null
    return data
  }

  // GET /vet?action=validate&token=xxx
  if (req.method === 'GET' && action === 'validate') {
    const token = url.searchParams.get('token')
    if (!token) return json({ error: 'Missing token' }, 400)
    const session = await validateToken(token)
    if (!session) return json({ error: 'invalid_or_expired' }, 404)
    return json({ session })
  }

  const body = await req.json().catch(() => null)
  if (!body?.token) return json({ error: 'Missing token' }, 400)

  const session = await validateToken(body.token)
  if (!session) return json({ error: 'invalid_or_expired' }, 403)

  // POST with action=identify — store vet name + license
  if (action === 'identify') {
    const { vet_name, vet_license } = body
    if (!vet_name || !vet_license) return json({ error: 'Missing vet_name or vet_license' }, 400)
    await supabase.from('vet_sessions').update({ vet_name, vet_license }).eq('token', body.token)
    return json({ ok: true })
  }

  // POST with action=add_record
  if (action === 'add_record') {
    const { record_type, record } = body
    if (!session.vet_name || !session.vet_license) return json({ error: 'Vet not identified' }, 403)

    const added_by = { type: 'vet', name: session.vet_name, vet_license: session.vet_license }
    const tables: Record<string, string> = { vaccine: 'vaccines', symptom: 'symptoms', medication: 'medications', document: 'documents' }
    const table = tables[record_type]
    if (!table) return json({ error: 'Invalid record_type' }, 400)

    const { data, error } = await supabase.from(table).insert({ ...record, pet_id: session.pet_id, added_by }).select().single()
    if (error) return json({ error: error.message }, 500)
    return json({ data })
  }

  return json({ error: 'Unknown action' }, 400)
})
