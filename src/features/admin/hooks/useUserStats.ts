/* ============================================================
   useUserStats.ts — Hook de estadisticas por usuario
   FASE 06 — GYM-YJMG
   Responsabilidad: estado de carga y datos de fetchUserStats.
   Limite: 60 lineas — SKILL-CODE §2.4 (custom hook ≤100)
   ============================================================ */
import { useState, useEffect } from 'react'
import { fetchUserStats } from '../../../services/user-stats.service'
import type { UserStats } from '../../../services/user-stats.service'

type Return = {
  stats:   UserStats | null
  loading: boolean
  error:   string | null
}

const EMPTY_STATS: UserStats = {
  totalSessions:        0,
  totalMinutes:         0,
  lastSessionDate:      null,
  daysSinceLastSession: null,
  topMuscleGroup:       null,
  currentStreak:        0,
}

export function useUserStats(userId: string | null): Return {
  const [stats,   setStats]   = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setStats(EMPTY_STATS); return }
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchUserStats(userId)
      .then((data: UserStats) => {
        if (!cancelled) { setStats(data); setLoading(false) }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar estadisticas')
          setStats(EMPTY_STATS)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [userId])

  return { stats, loading, error }
}
