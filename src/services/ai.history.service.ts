/* ============================================================
   ai.history.service.ts — Consulta historial de sets de un ejercicio
   Responsabilidad: obtener sets históricos de un ejercicio.
   Usa 2 queries porque PostgREST no soporta filtros a 2+ niveles
   de profundidad en recursos embebidos desde session_sets.
   Columna real en BD: set_number (1-based), status = 'completed'.

   NOTA (2026-07-01): este archivo alimentaba el Modelo 1 LSTM
   (peso+reps), retirado del frontend por sesgo: fue entrenado
   agrupando por músculo general en vez de por ejercicio específico
   (ver ml/REPORTE_MODELO1_LSTM.md). Se conserva `fetchHistoricalSets`
   por si se reentrena a futuro con granularidad por ejercicio.
   `fetchLastCompletedSet` es el reemplazo actual: solo trae el
   último set registrado para recordar al usuario su carga anterior.

   CORRECCIONES APLICADAS (auditoría 2026-05-31, vigentes para fetchHistoricalSets):
   - B4: Historial ahora se invierte a orden ASC antes de retornar.
     El LSTM fue entrenado con secuencias cronológicas (Colab build_sequences
     usa sort_values ASC). Traer DESC y .reverse() da los N sets más recientes
     en el orden temporal correcto.
   - B2: feature `position` corregida de (set_number - 1) a (set_number / 8).
     El modelo fue entrenado con positions = np.arange(1, N+1) / WINDOW_SIZE.
     set_number (1-based) / 8 es el análogo más cercano disponible desde BD.
     Valor 8 debe coincidir con window_size en scaler_config.json.
   ============================================================ */
import { supabase } from './supabase'

export type SetDataPoint = {
  weightKg: number
  reps: number
  position: number
}

export type LastCompletedSet = {
  weightKg: number
  reps: number
  completedAt: string
}

type SessionExerciseRow = {
  id: string
}

type HistoryRow = {
  weight: number | null
  reps: number | null
  set_number: number
  completed_at: string | null
}

async function fetchSessionExerciseIds(
  userId: string,
  exerciseId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select('id, sessions!inner(user_id, status)')
    .eq('exercise_id', exerciseId)
    .eq('sessions.user_id', userId)
    .eq('sessions.status', 'completed')

  if (error || !data) return []
  return (data as unknown as SessionExerciseRow[]).map((row) => row.id)
}

export async function fetchHistoricalSets(
  userId: string,
  exerciseId: string,
  limit: number,
): Promise<SetDataPoint[]> {
  const sessionExerciseIds = await fetchSessionExerciseIds(userId, exerciseId)
  if (sessionExerciseIds.length === 0) return []

  // B4: Se trae en DESC para obtener los más RECIENTES (limit aplica correctamente),
  // luego se invierte con .reverse() para que el array quede en orden ASC (cronológico).
  // Antes: DESC sin invertir → el LSTM recibía [reciente, ..., antiguo], orden opuesto al
  // entrenamiento donde build_sequences usa sort_values(['Date','Set Order']) ASC.
  const { data, error } = await supabase
    .from('session_sets')
    .select('weight, reps, set_number, completed_at')
    .in('session_exercise_id', sessionExerciseIds)
    .not('weight', 'is', null)
    .not('reps', 'is', null)
    .eq('is_warmup', false)
    .order('completed_at', { ascending: false })  // DESC para que limit capture los más recientes
    .limit(limit)

  if (error || !data) return []

  return (data as unknown as HistoryRow[])
    .filter((row) => row.weight !== null && row.reps !== null)
    .map((row) => ({
      weightKg: row.weight as number,
      reps: row.reps as number,
      // B2: position corregida — antes: set_number - 1 (enteros 0,1,2 sin normalizar).
      // El modelo se entrenó con positions = np.arange(1, N+1) / WINDOW_SIZE, que produce
      // valores como 0.125, 0.25, ..., 1.0 para una ventana de 8. set_number/8 es el
      // análogo más cercano. (8 = window_size en scaler_config.json — actualizar si cambia).
      position: row.set_number / 8,
    }))
    .reverse()  // B4: invertir de DESC a ASC para coincidir con el orden del entrenamiento
}

/** Trae el último set completado (peso+reps) de un ejercicio para recordarle
 *  al usuario su carga anterior. Reemplaza la sugerencia del LSTM retirado. */
export async function fetchLastCompletedSet(
  userId: string,
  exerciseId: string,
): Promise<LastCompletedSet | null> {
  const sessionExerciseIds = await fetchSessionExerciseIds(userId, exerciseId)
  if (sessionExerciseIds.length === 0) return null

  const { data, error } = await supabase
    .from('session_sets')
    .select('weight, reps, completed_at')
    .in('session_exercise_id', sessionExerciseIds)
    .not('weight', 'is', null)
    .not('reps', 'is', null)
    .eq('is_warmup', false)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const row = data as { weight: number | null; reps: number | null; completed_at: string | null }
  if (row.weight === null || row.reps === null || row.completed_at === null) return null

  return { weightKg: row.weight, reps: row.reps, completedAt: row.completed_at }
}
