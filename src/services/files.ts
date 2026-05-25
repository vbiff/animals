import { supabase } from './supabase'

export async function uploadFile(petId: string, folder: 'documents' | 'vaccines' | 'photos' | 'medications' | 'treats', file: File): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : null
  if (!ext) throw new Error('File must have an extension')
  const path = `${petId}/${folder}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('pet-files').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = await supabase.storage.from('pet-files').createSignedUrl(path, 60 * 60 * 24 * 7)
  if (!data) throw new Error('Failed to create signed URL')
  return data.signedUrl
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from('pet-files').createSignedUrl(path, expiresIn)
  if (error || !data) throw new Error('Failed to get signed URL')
  return data.signedUrl
}
