/* ============================================================
   useMuscleRecovery.ts — v2.0 — Modelo ATL Banister
   GYM-YJMG — FASE 03

   ANTES (v1.0): thresholds hardcodeados (2 días, 4 sets, 8 sets)
   AHORA (v2.0): modelo de decaimiento exponencial calibrado.

   El JSON fatigue_decay_config.json (Modelo 3) provee:
     - tau_days por músculo: constante de recuperación calibrada
     - max_atl_p95: valor de normalización a score 0-100
     - score_thresholds: límites de exhausted / recovering / recovered

   Fórmula ATL (Acute Training Load — Banister):
     fatigue(hoy) = Σ [volumen_sesión × exp(-días_transcurridos / tau)]
     score = min(100, fatigue / max_atl_p95 × 100)

   El score continuo reemplaza los 3 estados discretos anteriores,
   dando una intensidad proporcional al body map SVG.
   ============================================================ */
import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'

// ─── Tipos públicos ──────────────────────────────────────────

export type MuscleState = 'exhausted' | 'recovering' | 'recovered'

export type MuscleRecovery = {
  muscle_group: string
  state:        MuscleState
  score:        number      // 0-100: continuo (nuevo en v2.0)
  last_worked:  string      // YYYY-MM-DD
  sets_done:    number
}

// ─── Mapeo DB → BodyMap ID ───────────────────────────────────

const DB_TO_BODYMAP: Record<string, string> = {
  pecho: 'chest',      chest: 'chest',
  espalda: 'upper_back', back: 'upper_back', lats: 'upper_back',
  trapecio: 'trapezius', traps: 'trapezius',
  hombros: 'deltoids',   shoulders: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  abdomen: 'abdominals', abs: 'abdominals',
  piernas: 'quadriceps', quads: 'quadriceps',
  gluteos: 'gluteals',   glutes: 'gluteals',
  pantorrilla: 'calves', calves: 'calves',
  antebrazos: 'forearms', forearms: 'forearms',
  cuello: 'neck',        neck: 'neck',
}

// ─── Config del modelo ATL ───────────────────────────────────

type MuscleATLConfig = {
  tau_days:    number
  max_atl_p95: number
  calibrated:  boolean
}

type FatigueDecayConfig = {
  score_thresholds: {
    exhausted_above:  number
    recovering_above: number
  }
  muscle_groups: Record<string, MuscleATLConfig>
}

// Fallback si el fetch del JSON falla (valores Banister estándar)
const DEFAULT_ATL_CONFIG: FatigueDecayConfig = {
  score_thresholds: { exhausted_above: 39.3, recovering_above: 9.2 },
  muscle_groups: {},
}

const DEFAULT_MUSCLE_ATL: MuscleATLConfig = {
  tau_days: 2.0,
  max_atl_p95: 100.0,
  calibrated: false,
}

// ─── Función ATL pura ────────────────────────────────────────

/**
 * Calcula el score de fatiga (0-100) para un músculo dado
 * usando el modelo de Banister (decaimiento exponencial).
 *
 * @param history  - Array de sesiones con fecha y volumen (kg × reps)
 * @param tau      - Constante de tiempo de recuperación en días
 * @param maxAtlP95 - Valor de normalización (percentil 95 del ATL histórico)
 */
function computeATLScore(
  history: Array<{ date: string; volume: number }>,
  tau: number,
  maxAtlP95: number,
): number {
  if (history.length === 0 || tau <= 0 || maxAtlP95 <= 0) return 0

  const now = Date.now()
  let atl = 0

  for (const s of history) {
    const sessionMs = new Date(s.date).getTime()
    const daysSince = (now - sessionMs) / (1000 * 60 * 60 * 24)
    if (daysSince < 0) continue // ignorar fechas futuras
    atl += s.volume * Math.exp(-daysSince / tau)
  }

  return Math.min(100, (atl / maxAtlP95) * 100)
}

/**
 * Convierte score continuo (0-100) a estado discreto según
 * los umbrales calibrados del JSON.
 */
function scoreToState(score: number, thresholds: FatigueDecayConfig['score_thresholds']): MuscleState {
  if (score >= thresholds.exhausted_above)  return 'exhausted'
  if (score >= thresholds.recovering_above) return 'recovering'
  return 'recovered'
}

// ─── Hook principal ──────────────────────────────────────────

export function useMuscleRecovery() {
  const [recoveryData, setRecoveryData] = useState<Record<string, MuscleRecovery>>({})
  const [loading, setLoading] = useState(true)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) return

    async function fetchRecovery() {
      setLoading(true)

      // ── 1. Cargar config del modelo ATL ──────────────────
      // Se carga en paralelo con la query de BD para no bloquear.
      // Si falla, se usa el fallback de Banister estándar.
      let atlConfig: FatigueDecayConfig = DEFAULT_ATL_CONFIG
      try {
        const res = await fetch('/models/fatigue_decay_config.json')
        if (res.ok) {
          atlConfig = await res.json() as FatigueDecayConfig
        }
      } catch {
        // Silencioso: el fallback mantendrá el comportamiento anterior
        console.warn('[useMuscleRecovery] No se pudo cargar fatigue_decay_config.json — usando valores Banister estándar')
      }

      // ── 2. Query BD: sesiones de los últimos 14 días ──────
      // 14 días (en vez de 7 anteriores) para que el ATL acumule
      // suficiente historial y el decaimiento sea significativo.
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 14)
      const fromStr = fromDate.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          session_date,
          session_exercises (
            exercises_catalog ( muscle_group ),
            session_sets ( weight, reps )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('session_date', fromStr)

      if (error || !data) {
        setLoading(false)
        return
      }

      // ── 3. Acumular historial de volumen por músculo ───────
      // Volumen de carga = peso_kg × reps (por set, por sesión, por músculo)
      const muscleHistory: Record<string, Array<{ date: string; volume: number; sets: number }>> = {}

      for (const session of data as any[]) {
        const date: string = session.session_date
        for (const se of session.session_exercises || []) {
          const muscleGroup: string | undefined = se.exercises_catalog?.muscle_group
          if (!muscleGroup) continue

          const bodymapId = DB_TO_BODYMAP[muscleGroup.toLowerCase()] ?? muscleGroup.toLowerCase()
          let sessionVolume = 0
          let sessionSets = 0

          for (const set of se.session_sets || []) {
            const w = Number(set.weight) || 0
            const r = Number(set.reps) || 0
            if (r > 0) {
              sessionVolume += w * r
              sessionSets++
            }
          }

          if (sessionSets === 0) continue

          if (!muscleHistory[bodymapId]) muscleHistory[bodymapId] = []

          // Agregar por fecha (puede haber varias sesiones el mismo día)
          const existing = muscleHistory[bodymapId].find(h => h.date === date)
          if (existing) {
            existing.volume += sessionVolume
            existing.sets   += sessionSets
          } else {
            muscleHistory[bodymapId].push({ date, volume: sessionVolume, sets: sessionSets })
          }
        }
      }

      // ── 4. Calcular score ATL y estado por músculo ─────────
      const muscleMap: Record<string, MuscleRecovery> = {}

      for (const [bodymapId, history] of Object.entries(muscleHistory)) {
        const atlCfg = atlConfig.muscle_groups?.[bodymapId] ?? DEFAULT_MUSCLE_ATL

        const score = computeATLScore(
          history.map(h => ({ date: h.date, volume: h.volume })),
          atlCfg.tau_days,
          atlCfg.max_atl_p95,
        )

        const state = scoreToState(score, atlConfig.score_thresholds)

        // last_worked = fecha más reciente en el historial
        const lastWorked = history.reduce((latest, h) =>
          h.date > latest ? h.date : latest, history[0].date)
        const totalSets = history.reduce((sum, h) => sum + h.sets, 0)

        muscleMap[bodymapId] = {
          muscle_group: bodymapId,
          state,
          score: Math.round(score),
          last_worked: lastWorked,
          sets_done: totalSets,
        }
      }

      setRecoveryData(muscleMap)
      setLoading(false)
    }

    fetchRecovery()
  }, [userId])

  return { recoveryData, loading }
}
