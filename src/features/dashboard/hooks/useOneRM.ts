/* ============================================================
   useOneRM.ts — Hook para estimación de 1 Rep Max
   GYM-YJMG — FASE 03

   Carga one_rm_config.json (Modelo 4 — Regresión Lineal v2.0)
   y expone una función pura para estimar 1RM desde el browser.

   Fórmula (v2.0 — sin circularidad):
     1RM = coef_a * peso_kg + coef_b * reps + intercept

   Los coeficientes están calibrados por grupo muscular usando
   el consenso de 4 fórmulas 1RM establecidas en la literatura
   (Epley, Brzycki, Lander, O'Conner).

   USO EN EL COMPONENTE:
     const { estimateOneRM, loading } = useOneRM()
     const oneRM = estimateOneRM(80, 5, 'chest')  // → e.g. 92.3
   ============================================================ */
import { useEffect, useState, useCallback } from 'react'

// ─── Tipos ──────────────────────────────────────────────────

type MuscleCoefs = {
  coef_a:    number
  coef_b:    number
  intercept: number
  r2:        number
  mae_kg:    number
  calibrated: boolean
}

type OneRMConfig = {
  model_version: string
  formula:       string
  global_model:  MuscleCoefs & { note: string }
  by_muscle_group: Record<string, MuscleCoefs>
}

// ─── Hook ────────────────────────────────────────────────────

export function useOneRM() {
  const [config, setConfig] = useState<OneRMConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/models/one_rm_config.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<OneRMConfig>
      })
      .then(data => {
        setConfig(data)
        setLoading(false)
      })
      .catch(err => {
        console.warn('[useOneRM] No se pudo cargar one_rm_config.json:', err)
        setError(String(err))
        setLoading(false)
      })
  }, [])

  /**
   * Estima el 1RM para un peso y reps dados, usando los coeficientes
   * calibrados por grupo muscular.
   *
   * @param weightKg   - Peso levantado en kg
   * @param reps       - Repeticiones realizadas (1-12 idealmente)
   * @param muscleGroup - ID del grupo muscular (ej: 'chest', 'quadriceps')
   * @returns 1RM estimado en kg, redondeado a 0.5 kg. null si no hay config.
   */
  const estimateOneRM = useCallback((
    weightKg: number,
    reps: number,
    muscleGroup?: string,
  ): number | null => {
    if (!config) return null
    if (weightKg <= 0 || reps <= 0) return null

    // Usar coeficientes del músculo si están calibrados, si no el global
    const coefs = (muscleGroup && config.by_muscle_group[muscleGroup]?.calibrated)
      ? config.by_muscle_group[muscleGroup]
      : config.global_model

    const raw = coefs.coef_a * weightKg + coefs.coef_b * reps + coefs.intercept

    // Redondear a 0.5 kg (igual que el LSTM)
    return Math.round(raw * 2) / 2
  }, [config])

  return { estimateOneRM, config, loading, error }
}
