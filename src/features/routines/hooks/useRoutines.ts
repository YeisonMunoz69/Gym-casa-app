import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import {
  loadRoutinesWithDays,
  createRoutine,
  deleteRoutine,
  toggleRoutineActive,
} from '../../../services/routines.service'
import type { RoutineWithDays } from '../../../types/routine'

type UseRoutinesReturn = {
  routines: RoutineWithDays[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addRoutine: (name: string) => Promise<string | null>
  removeRoutine: (id: string) => Promise<boolean>
  setActive: (id: string, active: boolean) => Promise<boolean>
}

export function useRoutines(): UseRoutinesReturn {
  const userId = useAuthStore((s) => s.user?.id)
  const [routines, setRoutines] = useState<RoutineWithDays[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const result = await loadRoutinesWithDays(userId)
    setRoutines(result.data)
    setError(result.error)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addRoutine(name: string): Promise<string | null> {
    if (!userId) return null
    const result = await createRoutine(userId, name)
    if (result.error || !result.data) {
      setError(result.error)
      return null
    }
    await refresh()
    return result.data.id
  }

  async function removeRoutine(id: string): Promise<boolean> {
    const result = await deleteRoutine(id)
    if (result.error) {
      setError(result.error)
      return false
    }
    await refresh()
    return true
  }

  async function setActive(id: string, active: boolean): Promise<boolean> {
    const result = await toggleRoutineActive(id, active)
    if (result.error) {
      setError(result.error)
      return false
    }
    await refresh()
    return true
  }

  return { routines, loading, error, refresh, addRoutine, removeRoutine, setActive }
}
