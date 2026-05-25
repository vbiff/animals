import { supabase } from './supabase'
import type { AddedBy, Vaccine, Symptom, Medication, Document } from '../types'

async function ownerAddedBy(): Promise<AddedBy> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { type: 'owner', name: session.user.user_metadata.full_name ?? session.user.email ?? '', user_id: session.user.id }
}

async function fetchAll<T>(table: string, petId: string, orderBy = 'created_at'): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').eq('pet_id', petId).order(orderBy, { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

export async function getRecords(petId: string) {
  const [vaccines, symptoms, medications, documents] = await Promise.all([
    fetchAll<Vaccine>('vaccines', petId),
    fetchAll<Symptom>('symptoms', petId, 'date'),
    fetchAll<Medication>('medications', petId),
    fetchAll<Document>('documents', petId),
  ])
  return { vaccines, symptoms, medications, documents }
}

export async function addVaccine(petId: string, input: Omit<Vaccine, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Vaccine> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('vaccines').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Vaccine
}

export async function addSymptom(petId: string, input: Omit<Symptom, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Symptom> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('symptoms').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Symptom
}

export async function updateSymptom(id: string, input: Partial<Omit<Symptom, 'id' | 'pet_id' | 'added_by' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('symptoms').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addMedication(petId: string, input: Omit<Medication, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Medication> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('medications').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Medication
}

export async function updateMedication(id: string, input: Partial<Omit<Medication, 'id' | 'pet_id' | 'added_by' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('medications').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addDocument(petId: string, input: Omit<Document, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Document> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('documents').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Document
}

export async function deleteRecord(table: 'vaccines' | 'symptoms' | 'medications' | 'documents', id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
