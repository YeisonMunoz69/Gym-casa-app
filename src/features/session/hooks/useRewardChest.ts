/* ============================================================
   useRewardChest.ts — Ejercicio bonus aleatorio desde Supabase
   FASE 06 — GYM-YJMG
   Actualizado: Usa ejercicios muscle_group='Bonificacion' de la BD
   con imagenes en Supabase Storage. Mantiene la interfaz existente.
   ============================================================ */
import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase'
import type { SessionExerciseItem } from '../../../types/session'

export type RewardExercise = {
  name:         string
  muscleGroup:  string
  sets:         number
  reps:         string
  restSeconds:  number
  imageUrl:     string
  description:  string | null   // instrucciones del catálogo
}

type BonusRow = {
  name:         string
  muscle_group: string
  image_url:    string | null
  instructions: string | null
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function toRewardExercise(row: BonusRow): RewardExercise {
  return {
    name:        row.name,
    muscleGroup: row.muscle_group,
    sets:        1,
    reps:        '12-15',
    restSeconds: 45,
    imageUrl:    row.image_url ?? '/bonus/plank.png',
    description: row.instructions ?? null,
  }
}

const FALLBACK: RewardExercise = {
  name: 'Plancha Isometrica', muscleGroup: 'Bonificacion',
  sets: 1, reps: '30s', restSeconds: 45,
  imageUrl: '/bonus/plank.png', description: null,
}

export function useRewardChest(
  _exercises: SessionExerciseItem[],
  _cardioOnly = false,
): { reward: RewardExercise; loading: boolean } {
  const [reward, setReward] = useState<RewardExercise>(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchBonus() {
      const { data, error } = await supabase
        .from('exercises_catalog')
        .select('name, muscle_group, image_url, instructions')
        .eq('muscle_group', 'Bonificacion')

      if (!cancelled) {
        if (!error && data && data.length > 0) {
          setReward(toRewardExercise(pickRandom(data as BonusRow[])))
        }
        setLoading(false)
      }
    }

    fetchBonus()
    return () => { cancelled = true }
  }, [])

  return { reward, loading }
}
