import { supabase } from './supabase'
import type { Pet } from '../types'

async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return session
}

export async function getPets(): Promise<Pet[]> {
  const session = await requireSession()
  const { data, error } = await supabase
    .from('pets')
    .select('*, pet_owners!inner(user_id)')
    .eq('pet_owners.user_id', session.user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Pet[]
}

export async function getPet(id: string): Promise<Pet> {
  const { data, error } = await supabase.from('pets').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as Pet
}

export async function createPet(input: Omit<Pet, 'id' | 'photo_url' | 'created_at'>): Promise<Pet> {
  const session = await requireSession()
  const { data: pet, error } = await supabase.from('pets').insert(input).select().single()
  if (error) throw new Error(error.message)
  const { error: ownerErr } = await supabase.from('pet_owners').insert({ pet_id: pet.id, user_id: session.user.id, invited_by: null })
  if (ownerErr) throw new Error(ownerErr.message)
  return pet as Pet
}

export async function updatePet(id: string, input: Partial<Omit<Pet, 'id' | 'created_at'>>): Promise<Pet> {
  const { data, error } = await supabase.from('pets').update(input).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Pet
}
