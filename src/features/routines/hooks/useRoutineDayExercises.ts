import { useState, useEffect, useCallback } from 'react'
import {
  loadDayExercises,
  addExerciseToDay,
  removeExerciseFromDay,
  updateExerciseParams,
} from '../../../services/routines.service'
import type { RoutineExerciseWithDetails, RoutineExerciseRow } from '../../../types/routine'

type UseDayExercisesReturn = {
  exercises: RoutineExerciseWithDetails[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addExercise: (exerciseId: string) => Promise<boolean>
  removeExercise: (rowId: string) => Promise<boolean>
  updateParams: (rowId: string, params: Partial<RoutineExerciseRow>) => Promise<boolean>
}

export function useRoutineDayExercises(dayId: string | null): UseDayExercisesReturn {
  const [exercises, setExercises] = useState<RoutineExerciseWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!dayId) return
    setLoading(true)
    const result = await loadDayExercises(dayId)
    setExercises(result.data)
    setError(result.error)
    setLoading(false)
  }, [dayId])

  useEffect(() => {
    if (dayId) refresh()
    else setExercises([])
  }, [dayId, refresh])

  async function addExercise(exerciseId: string): Promise<boolean> {
    if (!dayId) return false
    const nextIndex = exercises.length
    const result = await addExerciseToDay(dayId, exerciseId, nextIndex)
    if (result.error) {
      setError(result.error)
      return false
    }
    await refresh()
    return true
  }

  async function removeExercise(rowId: string): Promise<boolean> {
    const result = await removeExerciseFromDay(rowId)
    if (result.error) {
      setError(result.error)
      return false
    }
    await refresh()
    return true
  }

  async function updateParams(
    rowId: string,
    params: Partial<RoutineExerciseRow>,
  ): Promise<boolean> {
    const result = await updateExerciseParams(rowId, params)
    if (result.error) {
      setError(result.error)
      return false
    }
    await refresh()
    return true
  }

  return { exercises, loading, error, refresh, addExercise, removeExercise, updateParams }
}
