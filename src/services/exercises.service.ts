import { supabase } from './supabase'
import type { ExerciseCatalogRow } from '../types/exercise'

export async function loadExercisesCatalog(): Promise<{
  data: ExerciseCatalogRow[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('exercises_catalog')
    .select('*')
    .order('name', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as ExerciseCatalogRow[], error: null }
}

export async function searchExercises(
  query: string,
): Promise<{ data: ExerciseCatalogRow[]; error: string | null }> {
  let request = supabase
    .from('exercises_catalog')
    .select('*')

  if (query.trim()) {
    request = request.ilike('name', `%${query}%`)
  }

  const { data, error } = await request
    .order('name', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as ExerciseCatalogRow[], error: null }
}

type CreateExerciseInput = {
  userId: string
  name: string
  muscleGroup: string
  equipment?: string
  instructions?: string
  imageUrl?: string
}

export async function createCustomExercise(
  input: CreateExerciseInput,
): Promise<{ data: ExerciseCatalogRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('exercises_catalog')
    .insert({
      user_id: input.userId,
      name: input.name.trim(),
      muscle_group: input.muscleGroup,
      equipment: input.equipment?.trim() || null,
      instructions: input.instructions?.trim() || null,
      image_url: input.imageUrl || null,
      media_source_type: input.imageUrl ? 'storage' : 'external_url',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ExerciseCatalogRow, error: null }
}

export async function deleteCustomExercise(
  exerciseId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('exercises_catalog')
    .delete()
    .eq('id', exerciseId)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}

/* ── Funciones de administrador ────────────────────────────── */

type AdminExerciseInput = {
  name:         string
  muscleGroup:  string
  equipment?:   string
  instructions?: string
  imageUrl?:    string
}

/** Crea un ejercicio global (sin user_id) — solo admin */
export async function createBonusExercise(
  input: AdminExerciseInput,
): Promise<{ data: ExerciseCatalogRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('exercises_catalog')
    .insert({
      name:              input.name.trim(),
      muscle_group:      input.muscleGroup,
      equipment:         input.equipment?.trim() || null,
      instructions:      input.instructions?.trim() || null,
      image_url:         input.imageUrl || null,
      media_source_type: input.imageUrl ? 'storage' : 'external_url',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ExerciseCatalogRow, error: null }
}

/** Edita cualquier ejercicio — solo admin (RLS permite al admin actualizar globales) */
export async function updateExercise(
  exerciseId: string,
  input: AdminExerciseInput,
): Promise<{ error: string | null }> {
  const patch: Record<string, unknown> = {
    name:         input.name.trim(),
    muscle_group: input.muscleGroup,
    equipment:    input.equipment?.trim() || null,
    instructions: input.instructions?.trim() || null,
  }
  if (input.imageUrl !== undefined) {
    patch.image_url         = input.imageUrl
    patch.media_source_type = input.imageUrl ? 'storage' : 'external_url'
  }

  const { error } = await supabase
    .from('exercises_catalog')
    .update(patch)
    .eq('id', exerciseId)

  return { error: error?.message ?? null }
}

/** Elimina cualquier ejercicio — solo admin */
export async function adminDeleteExercise(
  exerciseId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('exercises_catalog')
    .delete()
    .eq('id', exerciseId)

  return { error: error?.message ?? null }
}
