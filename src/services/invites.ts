import { supabase } from './supabase'
import type { InviteToken } from '../types'

async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return session
}

export async function createInvite(petId: string): Promise<InviteToken> {
  const session = await requireSession()
  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({ pet_id: petId, created_by: session.user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as InviteToken
}

export async function acceptInvite(token: string): Promise<string> {
  const session = await requireSession()

  const { data: invite, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invite) throw new Error('Invalid or expired invite')
  if (new Date(invite.expires_at) < new Date()) throw new Error('Invite has expired')
  if (invite.accepted_by) throw new Error('Invite already used')

  const { error: ownerErr } = await supabase
    .from('pet_owners')
    .insert({ pet_id: invite.pet_id, user_id: session.user.id, invited_by: invite.created_by })

  if (ownerErr && !ownerErr.message.includes('duplicate')) throw new Error(ownerErr.message)

  await supabase.from('invite_tokens').update({ accepted_by: session.user.id }).eq('id', invite.id)

  return invite.pet_id
}
