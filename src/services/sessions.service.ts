/* ============================================================
   sessions.service.ts — Acceso a Supabase para sesiones activas
   FASE 03 — GYM-YJMG
   Schema real (verificado desde v1):
     sessions:          id, user_id, routine_id, routine_day_id, session_date, start_time, end_time, status
     session_exercises: id, session_id, exercise_id, order_index, planned_sets, completed_sets
     session_sets:      id, session_exercise_id, set_number (1-based), weight, reps, rir, completed_at
   ============================================================ */
import { supabase } from './supabase'
import type { SessionSetPayload } from '../types/session'

/* ---- Sesión principal ---- */

export async function createSession(
  userId: string,
  routineId: string,
  routineDayId: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      routine_id: routineId,
      routine_day_id: routineDayId,
      session_date: new Date().toISOString().slice(0, 10),
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error) return { sessionId: null, error: error.message }
  return { sessionId: data.id as string, error: null }
}

export async function completeSession(
  sessionId: string,
  _durationSeconds: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      end_time: new Date().toISOString(),
    })
    .eq('id', sessionId)

  return { error: error?.message ?? null }
}

export async function cancelSession(
  sessionId: string,
): Promise<{ error: string | null }> {
  // En lugar de borrarla (puede haber llaves foraneas), la marcamos como cancelled
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'cancelled',
      end_time: new Date().toISOString(),
    })
    .eq('id', sessionId)

  return { error: error?.message ?? null }
}

/* ---- Ejercicios de sesión ---- */

export async function createSessionExercise(
  sessionId: string,
  exerciseId: string,
  orderIndex: number,
  plannedSets: number,
): Promise<{ sessionExerciseId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('session_exercises')
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      order_index: orderIndex,
      planned_sets: plannedSets,
      completed_sets: 0,
    })
    .select('id')
    .single()

  if (error) return { sessionExerciseId: null, error: error.message }
  return { sessionExerciseId: data.id as string, error: null }
}

/* ---- Sets de sesión ---- */

export async function saveSessionSet(
  payload: SessionSetPayload,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('session_sets')
    .upsert(
      {
        session_exercise_id: payload.session_exercise_id,
        set_number: payload.set_index + 1,  // BD usa 1-based
        weight: payload.weight,
        reps: payload.reps,
        rir: payload.rir,
        duration_seconds: payload.duration_seconds,
        completed_at: payload.completed_at,
      },
      { onConflict: 'session_exercise_id,set_number' },
    )

  return { error: error?.message ?? null }
}

export async function saveAllSessionSets(
  sets: SessionSetPayload[],
): Promise<{ error: string | null }> {
  if (sets.length === 0) return { error: null }

  const rows = sets.map((s) => ({
    session_exercise_id: s.session_exercise_id,
    set_number: s.set_index + 1,
    weight: s.weight,
    reps: s.reps,
    rir: s.rir,
    duration_seconds: s.duration_seconds,
    completed_at: s.completed_at,
  }))

  const { error } = await supabase
    .from('session_sets')
    .upsert(rows, { onConflict: 'session_exercise_id,set_number' })

  return { error: error?.message ?? null }
}

/* ---- Cofre de recompensa ---- */

/** Registra el ejercicio bonus del cofre en session_exercises del historial.
 *  NO crea session_sets — solo deja la traza del ejercicio en la sesión. */
export async function addBonusExerciseToHistory(
  _userId: string,
  sessionId: string,
  bonus: { name: string; sets: number },
  performed: { reps: number; weight: number }
): Promise<void> {
  // Buscar ejercicio en catálogo por nombre aproximado
  const { data: found } = await supabase
    .from('exercises_catalog')
    .select('id')
    .ilike('name', `%${bonus.name.split(' ')[0]}%`)
    .limit(1)
    .single()

  const exerciseId = found?.id ?? null
  if (!exerciseId) return   // Si no hay match en catálogo, omitir silenciosamente

  const { data: sessionEx } = await supabase.from('session_exercises').insert({
    session_id: sessionId,
    exercise_id: exerciseId,
    order_index: 999,           // Siempre al final
    planned_sets: bonus.sets,
    completed_sets: 1,          // Se completó la serie del cofre
  }).select('id').single()

  if (sessionEx?.id) {
    await supabase.from('session_sets').insert({
      session_exercise_id: sessionEx.id,
      set_number: 1,
      weight: performed.weight > 0 ? performed.weight : null,
      reps: performed.reps > 0 ? performed.reps : null,
      is_warmup: false,
      completed_at: new Date().toISOString(),
    })
  }
}
