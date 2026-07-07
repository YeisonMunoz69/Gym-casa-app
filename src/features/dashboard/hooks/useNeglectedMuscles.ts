/* ============================================================
   useNeglectedMuscles.ts — Detecta músculos no entrenados en X días
   GYM-YJMG

   RETIRADO (2026-07): antes usaba un umbral por músculo calibrado
   desde un dataset externo (muscle_thresholds_config.json, 721
   sesiones de un desconocido — joep89/weightlifting). Se retiró por
   no reflejar el entrenamiento real de esta familia. Ver nota de
   retiro en ml/REPORTE_MODELO2_MUSCULO_DESCUIDADO.md — el reporte
   y el JSON quedan como referencia para recalibrar cuando haya
   historial propio suficiente.

   AHORA: el umbral de "descuidado" se calcula en vivo con el
   historial real del usuario para cada músculo — percentil 75 de
   los gaps (días) entre sus propias sesiones consecutivas de ese
   músculo (mismo método estadístico que usaba el modelo retirado,
   pero aplicado a los datos reales de quien lo usa, no a los de
   un extraño). Si aún no hay suficiente historial personal
   (< 3 gaps = < 4 sesiones), se usa un default universal
   transparente de 7 días (entrenar cada músculo al menos 1x/semana
   es una guía general de fuerza, no un número ajustado a nadie).
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
  'espalda alta': 'upper_back', upper_back: 'upper_back',
  'espalda baja': 'lower_back', lower_back: 'lower_back', lumbar: 'lower_back',
  trapecio: 'trapezius', traps: 'trapezius',
  hombros: 'deltoids',   shoulders: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  piernas: 'quadriceps', quads: 'quadriceps',
  cuadriceps: 'quadriceps', 'cuádriceps': 'quadriceps', quadriceps: 'quadriceps',
  gluteos: 'gluteals',   glutes: 'gluteals',
  pantorrilla: 'calves', calves: 'calves',
  hamstrings: 'hamstrings', femorales: 'hamstrings',
}

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho',        upper_back: 'Espalda Alta',
  lower_back: 'Espalda Baja',  trapezius: 'Trapecio',
  deltoids: 'Hombros',   biceps: 'Bíceps',
  triceps: 'Tríceps',    quadriceps: 'Cuádriceps',
  hamstrings: 'Femorales', gluteals: 'Glúteos',
  calves: 'Pantorrillas',
}

// Ventana de historial a consultar. 180 días da margen suficiente
// para acumular al menos 3-4 gaps reales en músculos entrenados con
// poca frecuencia (ej. cada 2-3 semanas), sin traer todo el historial.
const HISTORY_WINDOW_DAYS = 180

// Default universal cuando el usuario aún no tiene suficiente historial
// propio para ese músculo — no es un umbral "adivinado" por músculo,
// es la guía general de entrenar cada grupo al menos 1x/semana.
const UNIVERSAL_DEFAULT_DAYS = 7

// Mínimo de gaps reales (días entre sesiones consecutivas) para confiar
// en el percentil 75 calculado con datos propios.
const MIN_GAPS_FOR_PERSONAL_THRESHOLD = 3

// ─── Tipos ─────────────────────────────────────────────────

export type NeglectedMuscle = {
  muscle_group:        string
  label:               string
  days_since:          number   // días desde la última sesión (o el tope de la ventana si nunca)
  neglect_threshold:   number   // umbral calculado (propio o default universal)
  basedOnPersonalData: boolean  // true = percentil 75 de gaps reales; false = default universal
}

/** Percentil (0-100) de un array YA ORDENADO ascendentemente. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  const weight = idx - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

// ─── Hook ──────────────────────────────────────────────────

export function useNeglectedMuscles() {
  const userId = useAuthStore(s => s.user?.id)
  const [neglected, setNeglected] = useState<NeglectedMuscle[]>([])
  const [calibrated, setCalibrated] = useState<string[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!userId) return

    async function compute() {
      setLoading(true)

      const fromWindow = new Date()
      fromWindow.setDate(fromWindow.getDate() - HISTORY_WINDOW_DAYS)

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
        .gte('session_date', fromWindow.toISOString().slice(0, 10))
        .order('session_date', { ascending: true })

      // Usuario sin ninguna sesión completada en la ventana: no tiene
      // sentido marcar "todo descuidado" el primer día que abre la app.
      if (!data || data.length === 0) {
        setNeglected([])
        setCalibrated([])
        setLoading(false)
        return
      }

      // Fechas (ascendente) en que se entrenó cada músculo — para
      // calcular tanto "última vez" como los gaps entre sesiones.
      const datesByMuscle: Record<string, string[]> = {}

      for (const session of (data || []) as any[]) {
        const seenThisSession = new Set<string>()
        for (const se of session.session_exercises || []) {
          const raw    = (se.exercises_catalog?.muscle_group || '').toLowerCase().trim()
          const muscle = DB_TO_MUSCLE[raw] ?? null
          if (!muscle || seenThisSession.has(muscle)) continue
          seenThisSession.add(muscle)
          if (!datesByMuscle[muscle]) datesByMuscle[muscle] = []
          datesByMuscle[muscle].push(session.session_date)
        }
      }

      const today   = Date.now()
      const results: NeglectedMuscle[] = []
      const calibratedGroups: string[] = []

      for (const muscle of MONITORED_MUSCLES) {
        const dates = datesByMuscle[muscle] ?? []
        calibratedGroups.push(muscle) // todos los monitoreados se evalúan ahora — ya no depende de un dataset externo

        const daysSince = dates.length > 0
          ? Math.floor((today - new Date(dates[dates.length - 1]).getTime()) / 86_400_000)
          : HISTORY_WINDOW_DAYS

        // Gaps entre sesiones consecutivas propias
        const gaps: number[] = []
        for (let i = 1; i < dates.length; i++) {
          const gap = Math.round(
            (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86_400_000,
          )
          if (gap > 0) gaps.push(gap)
        }
        gaps.sort((a, b) => a - b)

        const basedOnPersonalData = gaps.length >= MIN_GAPS_FOR_PERSONAL_THRESHOLD
        const threshold = basedOnPersonalData
          ? Math.round(percentile(gaps, 75))
          : UNIVERSAL_DEFAULT_DAYS

        if (daysSince >= threshold) {
          results.push({
            muscle_group:        muscle,
            label:               MUSCLE_LABELS[muscle] ?? muscle,
            days_since:          daysSince,
            neglect_threshold:   threshold,
            basedOnPersonalData,
          })
        }
      }

      // Ordenar de más descuidado a menos
      results.sort((a, b) => b.days_since - a.days_since)
      setNeglected(results)
      setCalibrated(calibratedGroups)
      setLoading(false)
    }

    compute()
  }, [userId])

  return { neglected, calibrated, loading }
}
