/* ============================================================
   progress.service.ts — Progresión de peso/reps/volumen por ejercicio
   FASE 04 — GYM-YJMG
   Tablas: session_sets → session_exercises → sessions, exercises_catalog
   Este servicio SOLO lee, nunca muta.

   FIX 2026-04-27:
   - Eliminado .order() por columna anidada (no soportado en Supabase PostgREST).
     El orden por fecha se hace en JS después de agrupar.
   - getExercisesWithHistory reescrito via sessions → session_exercises
     para evitar filtros de 2 niveles que retornan vacío.
   ============================================================ */
import { supabase } from './supabase'

export type ExerciseOption = {
  id: string
  name: string
}

export type ProgressPoint = {
  date: string        // YYYY-MM-DD
  maxWeight: number   // kg máximo del set en esa sesión
  totalVolume: number // kg × reps sumados en esa sesión
  maxReps: number
}

/** Lista los ejercicios para los que el usuario tiene historial de sets.
 *  Usa sessions como tabla raíz para filtrar user_id y status directamente. */
export async function getExercisesWithHistory(
  userId: string,
): Promise<{ data: ExerciseOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      session_exercises (
        exercise_id,
        exercises_catalog ( name )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (error || !data) {
    return { data: [], error: error?.message ?? 'Error al cargar ejercicios' }
  }

  const seen = new Map<string, string>()
  for (const session of data as any[]) {
    for (const se of (session.session_exercises ?? []) as any[]) {
      const id: string = se.exercise_id
      const name: string = se.exercises_catalog?.name
      if (id && name && !seen.has(id)) seen.set(id, name)
    }
  }

  const sorted = Array.from(seen.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { data: sorted, error: null }
}

/** Devuelve la progresión de peso/volumen de un ejercicio (últimas 12 sesiones).
 *  El orden por fecha se realiza en JS — PostgREST no soporta ordenar
 *  por columnas de tablas anidadas más de un nivel. */
export async function getExerciseProgress(
  userId: string,
  exerciseId: string,
): Promise<{ data: ProgressPoint[]; error: string | null }> {
  // Partimos desde sessions para filtrar user_id y status en el nivel raíz
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      session_date,
      session_exercises!inner (
        exercise_id,
        session_sets ( weight, reps )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('session_exercises.exercise_id', exerciseId)
    .order('session_date', { ascending: true })
    .limit(50)

  if (error || !data) {
    return { data: [], error: error?.message ?? 'Error al cargar progreso' }
  }

  // Agrupar sets por fecha de sesión
  const byDate = new Map<string, { weights: number[]; volumes: number[]; reps: number[] }>()

  for (const session of data as any[]) {
    const date: string = session.session_date
    if (!date) continue

    for (const se of (session.session_exercises ?? []) as any[]) {
      for (const set of (se.session_sets ?? []) as any[]) {
        const weight: number = set.weight ?? 0
        const reps: number = set.reps ?? 0

        if (!byDate.has(date)) byDate.set(date, { weights: [], volumes: [], reps: [] })
        const entry = byDate.get(date)!
        entry.weights.push(weight)
        entry.volumes.push(weight * reps)
        entry.reps.push(reps)
      }
    }
  }

  // Últimas 12 sesiones únicas con datos
  const points: ProgressPoint[] = Array.from(byDate.entries())
    .slice(-12)
    .map(([date, { weights, volumes, reps }]) => ({
      date,
      maxWeight: weights.length ? Math.max(...weights) : 0,
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      maxReps: reps.length ? Math.max(...reps) : 0,
    }))

  return { data: points, error: null }
}
