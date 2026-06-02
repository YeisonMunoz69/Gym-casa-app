/* ============================================================
   useNeglectedMuscles.ts — Detecta músculos no entrenados en X días
   GYM-YJMG — Modelo 2 (muscle_thresholds_config.json)

   Lógica:
   - Carga muscle_thresholds_config.json para obtener el umbral
     de negligencia calibrado por músculo (neglect_days).
   - Consulta sesiones de los últimos 90 días (cubre el umbral
     máximo de ~53 días del trapecio).
   - Calcula cuántos días hace que se entrenó cada músculo.
   - Si days_since >= neglect_days → el músculo es "descuidado".
   ============================================================ */
import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'

// Grupos musculares que monitoreamos (excluye abdominals/obliques sin datos)
const MONITORED_MUSCLES = [
  'chest', 'upper_back', 'lower_back', 'trapezius', 'deltoids',
  'biceps', 'triceps', 'quadriceps', 'hamstrings', 'gluteals', 'calves',
]

const DB_TO_MUSCLE: Record<string, string> = {
  pecho: 'chest',      chest: 'chest',
  espalda: 'upper_back', back: 'upper_back', lats: 'upper_back',
  trapecio: 'trapezius', traps: 'trapezius',
  hombros: 'deltoids',   shoulders: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  piernas: 'quadriceps', quads: 'quadriceps',
  gluteos: 'gluteals',   glutes: 'gluteals',
  pantorrilla: 'calves', calves: 'calves',
  lower_back: 'lower_back', lumbar: 'lower_back',
  hamstrings: 'hamstrings', femorales: 'hamstrings',
}

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho',        upper_back: 'Espalda Alta',
  lower_back: 'Lumbar',  trapezius: 'Trapecio',
  deltoids: 'Hombros',   biceps: 'Bíceps',
  triceps: 'Tríceps',    quadriceps: 'Cuádriceps',
  hamstrings: 'Femorales', gluteals: 'Glúteos',
  calves: 'Pantorrillas',
}

// ─── Tipos ─────────────────────────────────────────────────

export type NeglectedMuscle = {
  muscle_group:      string
  label:             string
  days_since:        number   // días desde la última sesión (o 90+ si nunca)
  neglect_threshold: number   // umbral del JSON
}

type ThresholdsJson = {
  muscle_groups:   Record<string, { neglect_days: number; calibrated: boolean }>
  global_defaults: { neglect_days: number }
}

// ─── Hook ──────────────────────────────────────────────────

export function useNeglectedMuscles() {
  const userId = useAuthStore(s => s.user?.id)
  const [neglected, setNeglected] = useState<NeglectedMuscle[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!userId) return

    async function compute() {
      setLoading(true)

      // 1. Cargar umbrales calibrados
      let thresholds: ThresholdsJson | null = null
      try {
        const res = await fetch('/models/muscle_thresholds_config.json')
        if (res.ok) thresholds = await res.json() as ThresholdsJson
      } catch { /* usar defaults */ }

      const globalDefault = thresholds?.global_defaults?.neglect_days ?? 5

      // 2. Query sesiones últimos 90 días
      //    (el umbral máximo confiable es ~30 días para tríceps)
      const from90 = new Date()
      from90.setDate(from90.getDate() - 90)

      const { data } = await supabase
        .from('sessions')
        .select(`
          session_date,
          session_exercises (
            exercises_catalog ( muscle_group )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('session_date', from90.toISOString().slice(0, 10))
        .order('session_date', { ascending: false })

      // 3. Encontrar la fecha más reciente de entrenamiento por músculo
      const lastWorked: Record<string, string> = {}

      for (const session of (data || []) as any[]) {
        for (const se of session.session_exercises || []) {
          const raw   = (se.exercises_catalog?.muscle_group || '').toLowerCase().trim()
          const muscle = DB_TO_MUSCLE[raw] ?? null
          if (!muscle) continue
          if (!lastWorked[muscle] || session.session_date > lastWorked[muscle]) {
            lastWorked[muscle] = session.session_date
          }
        }
      }

      // 4. Determinar músculos descuidados
      const today   = Date.now()
      const results: NeglectedMuscle[] = []

      for (const muscle of MONITORED_MUSCLES) {
        const cfg       = thresholds?.muscle_groups?.[muscle]
        const threshold = cfg?.neglect_days ?? globalDefault

        // Reglas de confiabilidad:
        //   a) Saltar músculos sin datos reales (calibrated: false)
        //   b) Saltar umbrales > 45 días (trapecio 53d/8ses, glúteos 264d/5ses)
        //      Son estadísticamente inestables con tan pocas sesiones.
        if (!cfg?.calibrated) continue
        if (threshold > 45) continue

        const last = lastWorked[muscle]
        const daysSince = last
          ? Math.floor((today - new Date(last).getTime()) / 86_400_000)
          : 90  // nunca entrenado en los últimos 90 días

        if (daysSince >= Math.round(threshold)) {
          results.push({
            muscle_group:      muscle,
            label:             MUSCLE_LABELS[muscle] ?? muscle,
            days_since:        daysSince,
            neglect_threshold: Math.round(threshold),
          })
        }
      }

      // Ordenar de más descuidado a menos
      results.sort((a, b) => b.days_since - a.days_since)
      setNeglected(results)
      setLoading(false)
    }

    compute()
  }, [userId])

  return { neglected, loading }
}
