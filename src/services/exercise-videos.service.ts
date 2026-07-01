/* ============================================================
   exercise-videos.service.ts — Acceso a Supabase para videos de
   referencia por ejercicio (tabla user_exercise_videos).
   Cada fila es privada del usuario dueño (RLS: auth.uid() = user_id).
   ============================================================ */
import { supabase } from './supabase'
import type { UserExerciseVideoRow } from '../types/exercise'

export async function getUserExerciseVideo(
  userId: string,
  exerciseId: string,
): Promise<UserExerciseVideoRow | null> {
  const { data, error } = await supabase
    .from('user_exercise_videos')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .maybeSingle()

  if (error || !data) return null
  return data as UserExerciseVideoRow
}

export async function saveUserExerciseVideo(
  userId: string,
  exerciseId: string,
  videoUrl: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_exercise_videos')
    .upsert(
      { user_id: userId, exercise_id: exerciseId, video_url: videoUrl },
      { onConflict: 'user_id,exercise_id' },
    )

  return { error: error?.message ?? null }
}

export async function deleteUserExerciseVideo(
  userId: string,
  exerciseId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_exercise_videos')
    .delete()
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)

  return { error: error?.message ?? null }
}

/** Trae los videos del usuario para varios ejercicios de una sola vez —
 *  usado al armar el payload de "compartir rutina". */
export async function getUserExerciseVideosBulk(
  userId: string,
  exerciseIds: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  if (exerciseIds.length === 0) return result

  const { data, error } = await supabase
    .from('user_exercise_videos')
    .select('exercise_id, video_url')
    .eq('user_id', userId)
    .in('exercise_id', exerciseIds)

  if (error || !data) return result

  for (const row of data as { exercise_id: string; video_url: string }[]) {
    result[row.exercise_id] = row.video_url
  }
  return result
}
