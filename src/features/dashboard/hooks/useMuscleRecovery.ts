import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'

export type MuscleState = 'exhausted' | 'recovering' | 'recovered'

export type MuscleRecovery = {
  muscle_group: string
  state: MuscleState
  last_worked: string // YYYY-MM-DD
  sets_done: number
}

// Mapeo inverso simple de DB a BodyMap ID
const DB_TO_BODYMAP: Record<string, string> = {
  pecho: 'chest', chest: 'chest',
  espalda: 'upper_back', back: 'upper_back', lats: 'upper_back',
  trapecio: 'trapezius', traps: 'trapezius',
  hombros: 'deltoids', shoulders: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  abdomen: 'abdominals', abs: 'abdominals',
  piernas: 'quadriceps', quads: 'quadriceps',
  gluteos: 'gluteals', glutes: 'gluteals',
  pantorrilla: 'calves', calves: 'calves',
  antebrazos: 'forearms', forearms: 'forearms',
  cuello: 'neck', neck: 'neck'
}

export function useMuscleRecovery() {
  const [recoveryData, setRecoveryData] = useState<Record<string, MuscleRecovery>>({})
  const [loading, setLoading] = useState(true)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) return

    async function fetchRecovery() {
      setLoading(true)
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 7)
      const fromStr = fromDate.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          session_date,
          session_exercises (
            exercises_catalog ( muscle_group ),
            session_sets ( id )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('session_date', fromStr)

      if (error || !data) {
        setLoading(false)
        return
      }

      const rawData = data as any[]
      const muscleMap: Record<string, MuscleRecovery> = {}
      const today = new Date().toISOString().slice(0, 10)
      const yesterdayObj = new Date()
      yesterdayObj.setDate(yesterdayObj.getDate() - 1)
      const yesterday = yesterdayObj.toISOString().slice(0, 10)

      for (const session of rawData) {
        const date = session.session_date
        for (const se of session.session_exercises || []) {
          const muscleGroup = se.exercises_catalog?.muscle_group
          if (!muscleGroup) continue
          
          const setsCount = se.session_sets?.length || 0
          if (setsCount === 0) continue

          const groupKey = muscleGroup.toLowerCase()
          const bodymapId = DB_TO_BODYMAP[groupKey] || groupKey

          if (!muscleMap[bodymapId]) {
            muscleMap[bodymapId] = {
              muscle_group: groupKey,
              state: 'recovered',
              last_worked: date,
              sets_done: setsCount
            }
          } else {
            // Actualizar si es más reciente
            if (date > muscleMap[bodymapId].last_worked) {
              muscleMap[bodymapId].last_worked = date
              muscleMap[bodymapId].sets_done = setsCount
            } else if (date === muscleMap[bodymapId].last_worked) {
              muscleMap[bodymapId].sets_done += setsCount
            }
          }
        }
      }

      // Evaluar estados
      for (const key of Object.keys(muscleMap)) {
        const item = muscleMap[key]
        if (item.last_worked === today) {
          item.state = 'exhausted'
        } else if (item.last_worked === yesterday) {
          item.state = item.sets_done > 4 ? 'recovering' : 'recovered'
        } else {
          const lastDate = new Date(item.last_worked)
          const diffTime = Math.abs(new Date().getTime() - lastDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays <= 2 && item.sets_done > 8) {
            item.state = 'recovering'
          } else {
            item.state = 'recovered'
          }
        }
      }

      setRecoveryData(muscleMap)
      setLoading(false)
    }

    fetchRecovery()
  }, [userId])

  return { recoveryData, loading }
}
