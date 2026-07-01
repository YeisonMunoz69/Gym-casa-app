export type RoutineRow = {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RoutineDayRow = {
  id: string
  routine_id: string
  weekday: number
  label: string | null
  created_at: string
  updated_at: string
}

export type RoutineExerciseRow = {
  id: string
  routine_day_id: string
  exercise_id: string
  order_index: number
  target_sets: number
  rep_min: number
  rep_max: number
  rir_target: number
  rest_seconds: number
  rest_between_exercises_seconds: number
  notes: string | null
  warmup_sets: number
  is_time_based: boolean
  target_time_seconds: number | null
  created_at: string
  updated_at: string
}

/** Routine exercise joined with exercise catalog data */
export type RoutineExerciseWithDetails = RoutineExerciseRow & {
  exercise: {
    id: string
    name: string
    muscle_group: string
    equipment: string | null
    image_url: string | null
  }
}

export type RoutineWithDays = RoutineRow & {
  routine_days: RoutineDayRow[]
}

/* ── FASE 05.5 — Compartir rutinas por QR ────────────────── */

export type SharedExercisePayload = {
  exerciseId: string
  exerciseName: string
  muscleGroup: string
  equipment: string | null
  imageUrl: string | null
  orderIndex: number
  targetSets: number
  repMin: number
  repMax: number
  rirTarget: number
  restSeconds: number
  restBetweenExercisesSeconds: number
  notes: string | null
  warmupSets: number
  isTimeBased: boolean
  targetTimeSeconds: number | null
  /** Video de referencia del que comparte — viaja como sugerencia inicial
   *  para quien importa. Cada usuario puede cambiar el suyo libremente
   *  después sin afectar al otro (ver user_exercise_videos). */
  suggestedVideoUrl?: string | null
}

export type SharedDayPayload = {
  weekday: number
  label: string | null
  exercises: SharedExercisePayload[]
}

export type SharedRoutinePayload = {
  version: 1
  routineName: string
  exportedAt: string
  days: SharedDayPayload[]
}

/** Fila de la tabla shared_routines en Supabase */
export type SharedRoutineSnapshot = {
  id: string
  source_user_id: string
  routine_name: string
  payload: SharedRoutinePayload
  created_at: string
}

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
}

export const WEEKDAY_SHORT: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mie',
  4: 'Jue',
  5: 'Vie',
  6: 'Sab',
}
