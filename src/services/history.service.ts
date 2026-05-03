/* ============================================================
   history.service.ts — Lectura del historial de sesiones
   FASE 04 — GYM-YJMG
   Tabla: sessions (user_id, session_date, status, start_time, end_time)
         + routine_days(label) via routine_day_id
   Este servicio SOLO lee, nunca muta.
   ============================================================ */
import { supabase } from './supabase'

export type HistoryFilter = 'week' | 'month'

export type SessionHistoryRow = {
  id: string
  session_date: string          // YYYY-MM-DD
  day_label: string             // nombre del día de rutina
  duration_seconds: number | null
  total_sets: number
}

export type SessionSetDetail = {
  set_number: number
  weight: number | null
  reps: number | null
  rir: number | null
}

export type SessionExerciseDetail = {
  exercise_name: string
  muscle_group: string
  sets: SessionSetDetail[]
}

function buildDateRange(filter: HistoryFilter): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (filter === 'week') {
    from.setDate(from.getDate() - 6)
  } else {
    from.setDate(from.getDate() - 29)
  }
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function calcDuration(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return diff > 0 ? Math.round(diff / 1000) : null
}

/** Devuelve sesiones completadas del usuario dentro del rango de filtro. */
export async function getSessionHistory(
  userId: string,
  filter: HistoryFilter,
): Promise<{ data: SessionHistoryRow[]; error: string | null }> {
  const { from, to } = buildDateRange(filter)

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      start_time,
      end_time,
      routine_days ( label ),
      session_exercises ( completed_sets )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('session_date', from)
    .lte('session_date', to)
    .order('session_date', { ascending: false })
    .limit(30)

  if (error || !data) {
    return { data: [], error: error?.message ?? 'Error al cargar historial' }
  }

  const rows: SessionHistoryRow[] = data.map((s: any) => {
    const totalSets = (s.session_exercises as any[])
      .reduce((acc: number, se: any) => acc + (se.completed_sets ?? 0), 0)
    return {
      id: s.id,
      session_date: s.session_date,
      day_label: (s.routine_days as any)?.label ?? 'Sesión',
      duration_seconds: calcDuration(s.start_time, s.end_time),
      total_sets: totalSets,
    }
  })

  return { data: rows, error: null }
}

/** Devuelve el detalle de ejercicios y sets de una sesión específica. */
export async function getSessionDetail(
  sessionId: string,
): Promise<{ data: SessionExerciseDetail[]; error: string | null }> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select(`
      exercises_catalog ( name, muscle_group ),
      session_sets ( set_number, weight, reps, rir )
    `)
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  if (error || !data) {
    return { data: [], error: error?.message ?? 'Error al cargar detalle' }
  }

  const exercises: SessionExerciseDetail[] = (data as any[]).map((se) => ({
    exercise_name: se.exercises_catalog?.name ?? 'Ejercicio',
    muscle_group: se.exercises_catalog?.muscle_group ?? '',
    sets: ((se.session_sets ?? []) as any[])
      .sort((a: any, b: any) => a.set_number - b.set_number)
      .map((s: any) => ({
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        rir: s.rir,
      })),
  }))

  return { data: exercises, error: null }
}
