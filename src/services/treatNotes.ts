import { supabase } from './supabase'
import type { AddedBy, TreatNote } from '../types'

async function ownerAddedBy(): Promise<AddedBy> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { type: 'owner', name: session.user.user_metadata.full_name ?? session.user.email ?? '', user_id: session.user.id }
}

export async function getTreatNotes(petId: string): Promise<TreatNote[]> {
  const { data, error } = await supabase.from('treat_notes').select('*').eq('pet_id', petId).order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TreatNote[]
}

export async function addTreatNote(petId: string, input: Omit<TreatNote, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<TreatNote> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('treat_notes').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as TreatNote
}

export async function updateTreatNote(id: string, input: Partial<Omit<TreatNote, 'id' | 'pet_id' | 'added_by' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('treat_notes').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTreatNote(id: string): Promise<void> {
  const { error } = await supabase.from('treat_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
