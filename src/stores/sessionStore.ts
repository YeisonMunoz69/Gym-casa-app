/* ============================================================
   sessionStore.ts — Estado global EN MEMORIA de la sesión activa
   FASE 03 — GYM-YJMG
   Regla crítica: este store NO persiste en BD. Solo Zustand.
   El guardado en BD ocurre en useActiveSession al finalizar.
   ============================================================ */
import { create } from 'zustand'
import type { SessionExerciseItem, SetDraft, SessionState } from '../types/session'

type SessionStore = SessionState & {
  /** Inicializa el store con los datos de la sesión nueva */
  initSession: (params: {
    sessionId: string
    sessionExerciseIds: Record<string, string>
    routineId: string
    routineDayId: string
    dayLabel: string
    exercises: SessionExerciseItem[]
  }) => void

  /** Cambia el ejercicio visible en pantalla */
  navigateToExercise: (index: number) => void

  /** Registra o actualiza un set en memoria */
  recordSet: (routineExerciseId: string, setDraft: SetDraft) => void

  /** Marca un set como completado (timestamp) */
  completeSet: (routineExerciseId: string, setIndex: number) => void

  /** Desmarca un set completado */
  uncompleteSet: (routineExerciseId: string, setIndex: number) => void

  /** Timer: inicia con N segundos */
  startTimer: (seconds: number, mode?: 'rest' | 'execution', initialElapsed?: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
  extendTimer: (seconds: number) => void
  tickTimer: () => void
  /** Resincroniza el restante (ej. al volver de segundo plano en iOS) sin
   *  tocar timerTotalSeconds — a diferencia de startTimer, que resetearía
   *  el total y rompería la barra de progreso. */
  syncTimerRemaining: (seconds: number) => void

  setStatus: (status: SessionState['status']) => void
  /** Mueve un ejercicio en memoria (no toca BD) */
  reorderExercises: (fromIndex: number, toIndex: number) => void
  /** Agrega un ejercicio bonus ad-hoc al final de la cola */
  addBonusExercise: (exercise: SessionExerciseItem, sessionExerciseId: string) => void
  clearSession: () => void
}

const INITIAL_STATE: SessionState = {
  sessionId: null,
  sessionExerciseIds: {},
  routineId: '',
  routineDayId: '',
  dayLabel: '',
  startedAt: '',
  exercises: [],
  currentExerciseIndex: 0,
  sets: {},
  timerMode: 'rest',
  timerTotalSeconds: 90,
  timerRemainingSeconds: 0,
  timerRunning: false,
  status: 'idle',
}

function buildInitialSets(
  exercises: SessionExerciseItem[],
): Record<string, SetDraft[]> {
  const result: Record<string, SetDraft[]> = {}

  for (const ex of exercises) {
    const warmupDrafts: SetDraft[] = Array.from(
      { length: ex.warmupSets },
      (_, i) => ({
        setIndex: i,
        weight: null,
        reps: null,
        rir: null,
        durationSeconds: null,
        isWarmup: true,
        completedAt: null,
      }),
    )
    const workDrafts: SetDraft[] = Array.from(
      { length: ex.targetSets },
      (_, i) => ({
        setIndex: ex.warmupSets + i,
        weight: null,
        reps: null,
        rir: null,
        durationSeconds: null,
        isWarmup: false,
        completedAt: null,
      }),
    )
    result[ex.routineExerciseId] = [...warmupDrafts, ...workDrafts]
  }

  return result
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...INITIAL_STATE,

  initSession({ sessionId, sessionExerciseIds, routineId, routineDayId, dayLabel, exercises }) {
    set({
      sessionId,
      sessionExerciseIds,
      routineId,
      routineDayId,
      dayLabel,
      startedAt: new Date().toISOString(),
      exercises,
      currentExerciseIndex: 0,
      sets: buildInitialSets(exercises),
      timerRemainingSeconds: 0,
      timerRunning: false,
      status: 'active',
    })
  },

  navigateToExercise(index) {
    set({ currentExerciseIndex: index })
  },

  recordSet(routineExerciseId, setDraft) {
    set((state) => {
      const existing = state.sets[routineExerciseId] ?? []
      const updated = existing.map((s) =>
        s.setIndex === setDraft.setIndex ? setDraft : s,
      )
      return { sets: { ...state.sets, [routineExerciseId]: updated } }
    })
  },

  completeSet(routineExerciseId, setIndex) {
    set((state) => {
      const existing = state.sets[routineExerciseId] ?? []
      const updated = existing.map((s) =>
        s.setIndex === setIndex
          ? { ...s, completedAt: new Date().toISOString() }
          : s,
      )
      return { sets: { ...state.sets, [routineExerciseId]: updated } }
    })
  },

  uncompleteSet(routineExerciseId, setIndex) {
    set((state) => {
      const existing = state.sets[routineExerciseId] ?? []
      const updated = existing.map((s) =>
        s.setIndex === setIndex
          ? { ...s, completedAt: null }
          : s,
      )
      return { sets: { ...state.sets, [routineExerciseId]: updated } }
    })
  },

  startTimer(seconds, mode = 'rest', initialElapsed = 0) {
    set({ 
      timerMode: mode,
      timerTotalSeconds: seconds, 
      timerRemainingSeconds: mode === 'execution' ? initialElapsed : seconds, 
      timerRunning: true 
    })
  },

  pauseTimer() {
    set({ timerRunning: false })
  },

  resumeTimer() {
    set({ timerRunning: true })
  },

  resetTimer() {
    set((s) => ({ timerRemainingSeconds: s.timerTotalSeconds, timerRunning: false }))
  },

  extendTimer(seconds) {
    set((s) => {
      const next = Math.max(0, s.timerRemainingSeconds + seconds)
      // Si llega a 0 al restar, pausamos el timer
      return { 
        timerRemainingSeconds: next,
        timerRunning: next > 0 ? s.timerRunning : false
      }
    })
  },

  syncTimerRemaining(seconds) {
    set((s) => {
      // Solo aplica a 'rest' (cuenta regresiva). 'execution' cuenta hacia
      // arriba y no tiene un deadline persistido con esta semántica.
      if (!s.timerRunning || s.timerMode !== 'rest') return {}
      const next = Math.max(0, seconds)
      return { timerRemainingSeconds: next, timerRunning: next > 0 }
    })
  },

  tickTimer() {
    set((s) => {
      if (!s.timerRunning) return {}
      
      if (s.timerMode === 'execution') {
        const next = s.timerRemainingSeconds + 1
        // Si hay un total y llegamos a él, nos detenemos. Si es 0, infinito.
        const done = s.timerTotalSeconds > 0 && next >= s.timerTotalSeconds
        return { timerRemainingSeconds: next, timerRunning: !done }
      } else {
        if (s.timerRemainingSeconds <= 0) return {}
        const next = s.timerRemainingSeconds - 1
        return { timerRemainingSeconds: next, timerRunning: next > 0 }
      }
    })
  },

  setStatus(status) {
    set({ status })
  },

  reorderExercises(fromIndex, toIndex) {
    set((state) => {
      const list = [...state.exercises]
      const [moved] = list.splice(fromIndex, 1)
      list.splice(toIndex, 0, moved)
      // Si el ejercicio actual era el movido, seguirlo
      let nextIndex = state.currentExerciseIndex
      if (state.currentExerciseIndex === fromIndex) {
        nextIndex = toIndex
      } else if (fromIndex < state.currentExerciseIndex && toIndex >= state.currentExerciseIndex) {
        nextIndex = state.currentExerciseIndex - 1
      } else if (fromIndex > state.currentExerciseIndex && toIndex <= state.currentExerciseIndex) {
        nextIndex = state.currentExerciseIndex + 1
      }
      return { exercises: list, currentExerciseIndex: nextIndex }
    })
  },

  addBonusExercise(exercise, sessionExerciseId) {
    set((state) => {
      const bonusDrafts = Array.from({ length: exercise.targetSets }, (_, i) => ({
        setIndex: i,
        weight: null,
        reps: null,
        rir: null,
        isWarmup: false,
        completedAt: null,
      }))
      return {
        exercises: [...state.exercises, exercise],
        sessionExerciseIds: {
          ...state.sessionExerciseIds,
          [exercise.routineExerciseId]: sessionExerciseId,
        },
        sets: { ...state.sets, [exercise.routineExerciseId]: bonusDrafts },
      }
    })
  },

  clearSession() {
    set(INITIAL_STATE)
  },
}))
