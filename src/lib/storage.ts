import { supabase } from './supabase'

export async function uploadAnimalPhoto(
  userId: string,
  file: File | Blob,
  fileName?: string
): Promise<{ url: string | null; error: Error | null }> {
  const name = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}`
  const filePath = `${userId}/${name}`

  const { error } = await supabase.storage
    .from('animal-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { url: null, error: error as unknown as Error }
  }

  const { data } = supabase.storage
    .from('animal-photos')
    .getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

export async function deleteAnimalPhoto(photoUrl: string): Promise<{ error: Error | null }> {
  const url = new URL(photoUrl)
  const pathParts = url.pathname.split('/animal-photos/')
  if (pathParts.length < 2) return { error: null }
  
  const filePath = pathParts[1]
  const { error } = await supabase.storage
    .from('animal-photos')
    .remove([filePath])

  return { error: error as unknown as Error | null }
}
