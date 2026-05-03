import { supabase } from './supabase'
import type { ExerciseCatalogRow } from '../types/exercise'

const BUCKET = 'exercise-media'

/** Sube un archivo al bucket y devuelve la URL publica */
export async function uploadExerciseImage(
  userId: string,
  exerciseId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${exerciseId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

/** Guarda la URL de imagen en exercises_catalog */
export async function saveExerciseImageUrl(
  exerciseId: string,
  imageUrl: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('exercises_catalog')
    .update({ image_url: imageUrl, media_source_type: 'storage' })
    .eq('id', exerciseId)

  return { error: error?.message ?? null }
}

/** Devuelve la URL publica de un archivo ya subido */
export function getExerciseImageUrl(userId: string, exerciseId: string, ext = 'jpg'): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${userId}/${exerciseId}.${ext}`)
  return data.publicUrl
}

/** Carga un ejercicio del catalogo por su ID */
export async function loadExerciseById(
  id: string,
): Promise<{ data: ExerciseCatalogRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('exercises_catalog')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ExerciseCatalogRow, error: null }
}
