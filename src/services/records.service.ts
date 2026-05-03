/* ============================================================
   records.service.ts — Lectura de Personal Records
   FASE 04 — GYM-YJMG
   NOTA: El trigger `check_and_insert_pr` en BD calcula el 1RM
   con Fórmula Epley y lo inserta. Este servicio SOLO lee.

   Schema real (001_new_features.sql):
     weight_kg, reps, one_rep_max_kg, achieved_at, exercise_id → exercises_catalog
   ============================================================ */
import { supabase } from './supabase'

export type PersonalRecord = {
  id: string
  user_id: string
  exercise_id: string
  exercise_name: string
  weight_kg: number
  reps: number
  one_rep_max_kg: number
  achieved_at: string
}

export type PersonalRecordWithRecency = PersonalRecord & {
  isNew: boolean // true si fue registrado en las últimas 4 semanas
}

/** Obtiene los mejores PRs del usuario, uno por ejercicio (el de mayor 1RM).
 *  Filtra por user_id y ordena descendente para que el mejor quede primero. */
export async function getPersonalRecords(
  userId: string
): Promise<{ data: PersonalRecordWithRecency[]; error: string | null }> {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      id,
      user_id,
      exercise_id,
      one_rep_max_kg,
      weight_kg,
      reps,
      achieved_at,
      exercises_catalog ( name )
    `)
    .eq('user_id', userId)
    .order('one_rep_max_kg', { ascending: false })

  if (error || !data) {
    return { data: [], error: error?.message ?? 'Error desconocido' }
  }

  // Deduplicar: mantener solo el mejor PR por ejercicio
  const bestByExercise = new Map<string, typeof data[0]>()
  for (const row of data) {
    if (!bestByExercise.has(row.exercise_id)) {
      bestByExercise.set(row.exercise_id, row)
    }
  }

  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const records: PersonalRecordWithRecency[] = Array.from(bestByExercise.values()).map(row => ({
    id: row.id,
    user_id: row.user_id,
    exercise_id: row.exercise_id,
    exercise_name: (row.exercises_catalog as any)?.name ?? 'Ejercicio',
    weight_kg: row.weight_kg ?? 0,
    reps: row.reps ?? 0,
    one_rep_max_kg: row.one_rep_max_kg ?? 0,
    achieved_at: row.achieved_at,
    isNew: new Date(row.achieved_at) >= fourWeeksAgo,
  }))

  return { data: records, error: null }
}
