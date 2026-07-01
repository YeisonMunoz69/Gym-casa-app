/* ============================================================
   useLastPerformance.ts — Último peso/reps registrados para un ejercicio
   Reemplaza useWeightSuggestion.ts (LSTM, retirado por sesgo de
   granularidad músculo-vs-ejercicio, ver ml/REPORTE_MODELO1_LSTM.md).
   Responsabilidad: traer el último set completado desde Supabase.
   NO renderiza nada.
   ============================================================ */
import { useEffect, useState } from 'react'
import { fetchLastCompletedSet } from '../../../services/ai.history.service'
import { useAuthStore } from '../../../stores/authStore'

export type LastPerformanceStatus = 'loading' | 'no-data' | 'ready'

type UseLastPerformanceReturn = {
  lastWeight: number | null
  lastReps: number | null
  lastDate: string | null
  status: LastPerformanceStatus
}

export function useLastPerformance(exerciseId: string): UseLastPerformanceReturn {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const [lastWeight, setLastWeight] = useState<number | null>(null)
  const [lastReps, setLastReps] = useState<number | null>(null)
  const [lastDate, setLastDate] = useState<string | null>(null)
  const [status, setStatus] = useState<LastPerformanceStatus>('loading')

  useEffect(() => {
    if (!userId || !exerciseId) {
      setStatus('loading')
      return
    }

    let cancelled = false
    setStatus('loading')
    setLastWeight(null)
    setLastReps(null)
    setLastDate(null)

    fetchLastCompletedSet(userId, exerciseId)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setStatus('no-data')
          return
        }
        setLastWeight(result.weightKg)
        setLastReps(result.reps)
        setLastDate(result.completedAt)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('no-data')
      })

    return () => {
      cancelled = true
    }
  }, [userId, exerciseId])

  return { lastWeight, lastReps, lastDate, status }
}
