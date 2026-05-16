import { supabase } from './supabase'
import type { VetSession } from '../types'

export async function createVetSession(petId: string): Promise<VetSession> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('vet_sessions')
    .insert({ pet_id: petId, created_by: session.user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as VetSession
}
