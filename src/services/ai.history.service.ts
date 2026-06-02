/* ============================================================
   ai.history.service.ts — Consulta historial de sets para LSTM
   Responsabilidad: obtener sets históricos de un ejercicio.
   Usa 2 queries porque PostgREST no soporta filtros a 2+ niveles
   de profundidad en recursos embebidos desde session_sets.
   Columna real en BD: set_number (1-based), status = 'completed'.

   CORRECCIONES APLICADAS (auditoría 2026-05-31):
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
import type { SetDataPoint } from './ai.lstm.service'

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
