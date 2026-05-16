export type AddedBy =
  | { type: 'owner'; name: string; user_id: string }
  | { type: 'vet'; name: string; vet_license: string }

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
}

export interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birth_date: string
  photo_url: string | null
  created_at: string
}

export interface Vaccine {
  id: string
  pet_id: string
  name: string
  date: string
  next_date: string | null
  document_url: string | null
  added_by: AddedBy
  created_at: string
}

export interface Symptom {
  id: string
  pet_id: string
  date: string
  title: string
  description: string
  added_by: AddedBy
  created_at: string
}

export interface Medication {
  id: string
  pet_id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date: string | null
  added_by: AddedBy
  created_at: string
}

export interface Document {
  id: string
  pet_id: string
  name: string
  file_url: string
  type: 'analysis' | 'xray' | 'prescription' | 'other'
  added_by: AddedBy
  created_at: string
}

export interface VetSession {
  id: string
  pet_id: string
  token: string
  expires_at: string
  created_by: string
  vet_name: string | null
  vet_license: string | null
}

export interface InviteToken {
  id: string
  pet_id: string
  token: string
  created_by: string
  accepted_by: string | null
  expires_at: string
  created_at: string
}

export type DocumentType = 'analysis' | 'xray' | 'prescription' | 'other'
export type Language = 'pt' | 'en' | 'ru'
