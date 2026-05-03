/* ============================================================
   useActiveSession.ts — Orquesta inicio, navegación y cierre de sesión
   FASE 03 — GYM-YJMG
   Responsabilidad: coordina servicios + store. NO renderiza nada.
   ============================================================ */
import { useCallback, useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { loadDayExercises } from '../../../services/routines.service'
import {
  createSession,
  createSessionExercise,
  completeSession,
  cancelSession,
  saveAllSessionSets,
} from '../../../services/sessions.service'
import type { SessionExerciseItem, SessionSetPayload, SessionSummaryData } from '../../../types/session'
import type { RoutineExerciseWithDetails } from '../../../types/routine'

type UseActiveSessionReturn = {
  isLoading: boolean
  error: string | null
  startSession: (params: {
    routineId: string
    routineDayId: string
    dayLabel: string
  }) => Promise<void>
  finishSession: () => Promise<SessionSummaryData | null>
  navigateNext: () => void
  navigatePrev: () => void
  abortSession: () => Promise<void>
  addBonusExercise: (exerciseId: string, exerciseName: string, targetSets: number) => Promise<void>
}

function mapToSessionExercise(row: RoutineExerciseWithDetails): SessionExerciseItem {
  return {
    routineExerciseId: row.id,
    exerciseId: row.exercise_id,
    name: row.exercise.name,
    muscleGroup: row.exercise.muscle_group,
    imageUrl: row.exercise.image_url,
    targetSets: row.target_sets,
    warmupSets: row.warmup_sets,
    repMin: row.rep_min,
    repMax: row.rep_max,
    rirTarget: row.rir_target,
    isTimeBased: row.is_time_based,
    targetTimeSeconds: row.target_time_seconds,
    restSeconds: row.rest_seconds,
    restBetweenExercisesSeconds: row.rest_between_exercises_seconds,
    notes: row.notes,
  }
}

function buildAllSetsPayload(
  sessionExerciseIds: Record<string, string>,
  sets: ReturnType<typeof useSessionStore.getState>['sets'],
): SessionSetPayload[] {
  const payloads: SessionSetPayload[] = []

  for (const [routineExId, drafts] of Object.entries(sets)) {
    const sessionExId = sessionExerciseIds[routineExId]
    if (!sessionExId) continue

    for (const draft of drafts) {
      if (draft.completedAt !== null || draft.reps !== null) {
        payloads.push({
          session_exercise_id: sessionExId,
          set_index: draft.setIndex,
          weight: draft.weight,
          reps: draft.reps,
          rir: draft.rir,
          duration_seconds: draft.durationSeconds ?? null,
          is_warmup: draft.isWarmup,
          completed_at: draft.completedAt,
        })
      }
    }
  }

  return payloads
}

export function useActiveSession(): UseActiveSessionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userId = useAuthStore((s) => s.user?.id)
  const store = useSessionStore()

  const startSession = useCallback(
    async ({ routineId, routineDayId, dayLabel }: {
      routineId: string; routineDayId: string; dayLabel: string
    }) => {
      if (!userId) return
      setIsLoading(true)
      setError(null)

      const { data: exercises, error: loadErr } = await loadDayExercises(routineDayId)
      if (loadErr) { setError(loadErr); setIsLoading(false); return }

      if (!exercises || exercises.length === 0) {
        setError('Este día no tiene ejercicios. Agrega algunos antes de entrenar.')
        setIsLoading(false)
        return
      }

      const { sessionId, error: createErr } = await createSession(userId, routineId, routineDayId)
      if (createErr || !sessionId) { setError(createErr ?? 'Error al crear sesión'); setIsLoading(false); return }

      const sessionExerciseIds: Record<string, string> = {}
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]
        const plannedSets = ex.target_sets + ex.warmup_sets
        const { sessionExerciseId, error: exErr } = await createSessionExercise(
          sessionId, ex.exercise_id, i, plannedSets,
        )
        if (exErr || !sessionExerciseId) continue
        sessionExerciseIds[ex.id] = sessionExerciseId
      }

      store.initSession({
        sessionId,
        sessionExerciseIds,
        routineId,
        routineDayId,
        dayLabel,
        exercises: exercises.map(mapToSessionExercise),
      })
      setIsLoading(false)
    },
    [userId, store],
  )

  const finishSession = useCallback(async (): Promise<SessionSummaryData | null> => {
    const state = useSessionStore.getState()
    if (!state.sessionId) return null

    store.setStatus('completing')

    const startedAt = new Date(state.startedAt).getTime()
    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000)

    const payloads = buildAllSetsPayload(state.sessionExerciseIds, state.sets)
    await saveAllSessionSets(payloads)
    await completeSession(state.sessionId, durationSeconds)

    const totalVolume = payloads.reduce((sum, s) => {
      return sum + (s.weight ?? 0) * (s.reps ?? 0)
    }, 0)

    const summary: SessionSummaryData = {
      totalSets: payloads.filter((s) => !s.is_warmup).length,
      totalVolume,
      durationSeconds,
      exercisesCount: state.exercises.length,
      dayLabel: state.dayLabel,
      sessionId: state.sessionId ?? undefined,
    }

    store.setStatus('done')
    return summary
  }, [store])

  const navigateNext = useCallback(() => {
    const { currentExerciseIndex, exercises } = useSessionStore.getState()
    if (currentExerciseIndex < exercises.length - 1) {
      store.navigateToExercise(currentExerciseIndex + 1)
    }
  }, [store])

  const navigatePrev = useCallback(() => {
    const { currentExerciseIndex } = useSessionStore.getState()
    if (currentExerciseIndex > 0) {
      store.navigateToExercise(currentExerciseIndex - 1)
    }
  }, [store])

  const abortSession = useCallback(async () => {
    const sId = useSessionStore.getState().sessionId
    if (sId) {
      await cancelSession(sId)
    }
    store.clearSession()
  }, [store])

  const addBonusExercise = useCallback(
    async (exerciseId: string, exerciseName: string, targetSets: number) => {
      const { sessionId, exercises } = useSessionStore.getState()
      if (!sessionId) return

      const nextIndex = exercises.length
      const plannedSets = targetSets
      const { sessionExerciseId, error: exErr } = await createSessionExercise(
        sessionId, exerciseId, nextIndex, plannedSets,
      )
      if (exErr || !sessionExerciseId) return

      // ID ficticio — el bonus no viene de routine_exercises
      const bonusRoutineExId = `bonus-${sessionExerciseId}`

      const bonusItem: SessionExerciseItem = {
        routineExerciseId: bonusRoutineExId,
        exerciseId,
        name: exerciseName,
        muscleGroup: '',
        imageUrl: null,
        targetSets,
        warmupSets: 0,
        repMin: 8,
        repMax: 12,
        rirTarget: 2,
        restSeconds: 90,
        restBetweenExercisesSeconds: 120,
        notes: null,
        isBonus: true,
      }

      store.addBonusExercise(bonusItem, sessionExerciseId)
    },
    [store],
  )

  return { isLoading, error, startSession, finishSession, navigateNext, navigatePrev, abortSession, addBonusExercise }
}
