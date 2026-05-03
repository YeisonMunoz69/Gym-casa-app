/* ============================================================
   session.ts — Tipos para la sesión de entrenamiento activa
   FASE 03 — GYM-YJMG
   ============================================================ */

/** Ejercicio tal como vive EN MEMORIA durante la sesión activa.
 *  Es una snapshot del routine_exercise + catálogo al momento de iniciar.
 *  NO se modifica en BD durante la sesión. */
export type SessionExerciseItem = {
  /** ID de la fila en routine_exercises */
  routineExerciseId: string
  /** ID en exercises_catalog */
  exerciseId: string
  name: string
  muscleGroup: string
  imageUrl: string | null
  /** Sets de trabajo */
  targetSets: number
  warmupSets: number
  repMin: number
  repMax: number
  rirTarget: number
  /** Indica si se mide por tiempo (cardio/isometría) en lugar de repeticiones */
  isTimeBased?: boolean
  targetTimeSeconds?: number | null
  /** Descanso entre series (segundos) */
  restSeconds: number
  /** Descanso tras terminar este ejercicio (segundos) */
  restBetweenExercisesSeconds: number
  notes: string | null
  /** Indica que este ejercicio fue agregado ad-hoc durante la sesión activa */
  isBonus?: boolean
}

/** Draft de un set individual, vive en memoria hasta guardar al blur o finalizar */
export type SetDraft = {
  /** Índice 0-based dentro del ejercicio */
  setIndex: number
  weight: number | null
  reps: number | null
  rir: number | null
  durationSeconds?: number | null
  isWarmup: boolean
  /** ISO timestamp cuando se marcó completado, null si no completado */
  completedAt: string | null
}

/** Estado global de la sesión activa en Zustand.
 *  Toda modificación temporal (reorden, params) vive aquí, NO en BD. */
export type SessionState = {
  /** ID en tabla sessions (null antes de iniciar) */
  sessionId: string | null
  /** ID en tabla session_exercises por routineExerciseId */
  sessionExerciseIds: Record<string, string>
  routineId: string
  routineDayId: string
  /** Nombre del día para mostrar en pantalla */
  dayLabel: string
  /** ISO timestamp de inicio */
  startedAt: string
  /** Ejercicios en el orden que se ejecutarán (en memoria, reordenable) */
  exercises: SessionExerciseItem[]
  /** Índice del ejercicio actualmente en pantalla */
  currentExerciseIndex: number
  /** Sets por routineExerciseId */
  sets: Record<string, SetDraft[]>
  /** Estado del timer de descanso */
  timerMode: 'rest' | 'execution'
  timerTotalSeconds: number
  timerRemainingSeconds: number
  timerRunning: boolean
  /** 'active' mientras se entrena, 'completing' al guardar, 'done' al finalizar */
  status: 'idle' | 'active' | 'completing' | 'done'
}

/** Datos de un set para guardar en session_sets */
export type SessionSetPayload = {
  session_exercise_id: string
  set_index: number
  weight: number | null
  reps: number | null
  rir: number | null
  duration_seconds?: number | null
  is_warmup: boolean
  completed_at: string | null
}

/** Resumen al finalizar la sesión */
export type SessionSummaryData = {
  totalSets: number
  totalVolume: number       // kg totales (peso × reps sumados)
  durationSeconds: number
  exercisesCount: number
  dayLabel: string
  sessionId?: string        // Para guardar bonus de recompensa en historial
}
