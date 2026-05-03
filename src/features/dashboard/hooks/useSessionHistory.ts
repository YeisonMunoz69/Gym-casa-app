/* ============================================================
   useSessionHistory.ts — Hook para historial de sesiones
   FASE 04 — GYM-YJMG
   ============================================================ */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import {
  getSessionHistory,
  type HistoryFilter,
  type SessionHistoryRow,
} from '../../../services/history.service'

export function useSessionHistory(filter: HistoryFilter) {
  const [sessions, setSessions] = useState<SessionHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useAuthStore(s => s.user?.id)

  useEffect(() => {
    if (!userId) return

    async function fetchHistory() {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await getSessionHistory(userId!, filter)

      if (fetchError) {
        setError(fetchError)
      } else {
        setSessions(data)
      }
      setLoading(false)
    }

    fetchHistory()
  }, [userId, filter])

  return { sessions, loading, error }
}
