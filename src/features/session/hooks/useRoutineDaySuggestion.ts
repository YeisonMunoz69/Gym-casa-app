/* ============================================================
   useRoutineDaySuggestion.ts — Sugiere rutina + día al entrar a Entrenar
   Responsabilidad: entre las rutinas activas, sugerir la que coincide
   con el día de hoy. Si hay varias, desempata por la más usada
   históricamente (total de sesiones completadas).
   NO renderiza nada. NO persiste nada — es solo una sugerencia inicial.
   ============================================================ */
import { useEffect, useState } from 'react'
import { getRoutineSessionCounts } from '../../../services/sessions.service'
import { getTodayWeekdayBogota } from '../../../utils/getTodayWeekdayBogota'
import type { RoutineWithDays } from '../../../types/routine'

type RoutineDaySuggestion = {
  suggestedRoutineId: string | null
  suggestedDayId: string | null
  loading: boolean
}

export function useRoutineDaySuggestion(
  activeRoutines: RoutineWithDays[],
  userId: string | undefined,
): RoutineDaySuggestion {
  const [suggestedRoutineId, setSuggestedRoutineId] = useState<string | null>(null)
  const [suggestedDayId, setSuggestedDayId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const routinesKey = activeRoutines.map((r) => r.id).join(',')

  useEffect(() => {
    if (!userId || activeRoutines.length === 0) {
      setSuggestedRoutineId(null)
      setSuggestedDayId(null)
      setLoading(false)
      return
    }

    const todayWeekday = getTodayWeekdayBogota()
    const matching = activeRoutines.filter((r) =>
      r.routine_days.some((d) => d.weekday === todayWeekday),
    )

    if (matching.length === 0) {
      setSuggestedRoutineId(null)
      setSuggestedDayId(null)
      setLoading(false)
      return
    }

    function todaysDayId(routine: RoutineWithDays): string | null {
      return routine.routine_days.find((d) => d.weekday === todayWeekday)?.id ?? null
    }

    if (matching.length === 1) {
      setSuggestedRoutineId(matching[0].id)
      setSuggestedDayId(todaysDayId(matching[0]))
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getRoutineSessionCounts(userId, matching.map((r) => r.id))
      .then((counts) => {
        if (cancelled) return
        const mostUsed = matching.reduce((best, r) =>
          (counts[r.id] ?? 0) > (counts[best.id] ?? 0) ? r : best,
        matching[0])
        setSuggestedRoutineId(mostUsed.id)
        setSuggestedDayId(todaysDayId(mostUsed))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setSuggestedRoutineId(matching[0].id)
        setSuggestedDayId(todaysDayId(matching[0]))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routinesKey, userId])

  return { suggestedRoutineId, suggestedDayId, loading }
}
