/* ============================================================
   useMuscleRecovery.ts — v3.0 — Modelo ATL Banister, sin calibración externa
   GYM-YJMG — FASE 03

   v1.0: thresholds hardcodeados (2 días, 4 sets, 8 sets).
   v2.0: tau/max_atl_p95 calibrados desde fatigue_decay_config.json
         (dataset externo joep89/weightlifting, 721 sesiones ajenas).

   RETIRADO (2026-07) el paso de calibración externa — ver nota en
   ml/REPORTE_MODELO3_FATIGA_ATL.md. La FÓRMULA de Banister se
   conserva (es ciencia deportiva establecida, no un modelo
   entrenado): lo que cambió es de dónde salen sus dos parámetros.

   v3.0 (actual):
     - tau_days: valores estándar de literatura de fuerza por tamaño
       de grupo muscular (no ajustados a ningún dataset — ver
       TAU_BY_MUSCLE_SIZE).
     - max_atl_p95: calculado EN VIVO con el historial real del
       propio usuario (percentil 95 de su propia serie de ATL
       histórico) — se autonormaliza a medida que entrena más.
     - Umbrales de estado (33/66): fijos, porque el score ya está
       autonormalizado contra el propio historial del usuario.

   Fórmula ATL (Acute Training Load — Banister):
     fatiga(hoy) = Σ [volumen_sesión × exp(-días_transcurridos / tau)]
     score = min(100, fatiga / max_atl_p95 × 100)
   ============================================================ */
import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'

// ─── Tipos públicos ──────────────────────────────────────────

export type MuscleState = 'exhausted' | 'recovering' | 'recovered'

export type MuscleRecovery = {
  muscle_group:        string
  state:                MuscleState
  score:                number      // 0-100: continuo, autonormalizado al propio historial
  last_worked:          string      // YYYY-MM-DD
  sets_done:            number      // sets completados en los últimos 7 días
  basedOnPersonalData:  boolean     // true = max_atl_p95 con ≥3 sesiones propias; false = bootstrap
}

// ─── Mapeo DB → BodyMap ID ───────────────────────────────────

const DB_TO_BODYMAP: Record<string, string> = {
  pecho: 'chest',      chest: 'chest',
  espalda: 'upper_back', back: 'upper_back', lats: 'upper_back',
  'espalda alta': 'upper_back', upper_back: 'upper_back',
  'espalda baja': 'lower_back', lower_back: 'lower_back', lumbar: 'lower_back',
  trapecio: 'trapezius', traps: 'trapezius',
  hombros: 'deltoids',   shoulders: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  abdomen: 'abdominals', abs: 'abdominals',
  piernas: 'quadriceps', quads: 'quadriceps',
  cuadriceps: 'quadriceps', 'cuádriceps': 'quadriceps', quadriceps: 'quadriceps',
  hamstrings: 'hamstrings', femorales: 'hamstrings',
  gluteos: 'gluteals',   glutes: 'gluteals',
  pantorrilla: 'calves', calves: 'calves',
  antebrazos: 'forearms', forearms: 'forearms',
  cuello: 'neck',        neck: 'neck',
}

// ─── Constantes del modelo (sin calibración externa) ──────────

// Días para que la fatiga se disipe, por tamaño de grupo muscular.
// Valores estándar de literatura de entrenamiento de fuerza — no
// ajustados a ningún dataset específico.
const TAU_BY_MUSCLE: Record<string, number> = {
  biceps: 1.5, triceps: 1.5, calves: 1.5, forearms: 1.5,
  abdominals: 1.5, obliques: 1.5, neck: 1.5,
  chest: 2.0, deltoids: 2.0, upper_back: 2.0, lower_back: 2.0,
  gluteals: 2.0, trapezius: 2.0,
  quadriceps: 2.5, hamstrings: 2.5,
}
const DEFAULT_TAU = 2.0

const SCORE_THRESHOLDS = { exhausted_above: 66, recovering_above: 33 }

// Ventana de historial para calcular el ATL histórico propio (más
// amplia que la fatiga "de hoy" en sí — sirve para tener suficientes
// sesiones y estimar un percentil 95 estable).
const HISTORY_WINDOW_DAYS = 90
const RECENT_SETS_WINDOW_DAYS = 7
const MIN_SESSIONS_FOR_PERSONAL_MAX = 3

// ─── Funciones puras del modelo ────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  const weight = idx - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/** ATL en un instante dado, sumando el aporte decaído de cada sesión previa. */
function atlAt(asOfMs: number, history: Array<{ ms: number; volume: number }>, tau: number): number {
  let atl = 0
  for (const h of history) {
    const daysSince = (asOfMs - h.ms) / (1000 * 60 * 60 * 24)
    if (daysSince < 0) continue
    atl += h.volume * Math.exp(-daysSince / tau)
  }
  return atl
}

/**
 * Calcula el score de fatiga (0-100) de un músculo con su propio
 * historial: max_atl_p95 se deriva de la serie de ATL calculada en
 * cada una de sus sesiones pasadas (autonormalización), no de un
 * valor externo calibrado con datos de otra persona.
 */
function computeATLScore(
  history: Array<{ date: string; volume: number }>,
  tau: number,
): { score: number; basedOnPersonalData: boolean } {
  if (history.length === 0) return { score: 0, basedOnPersonalData: false }

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const withMs = sorted.map(h => ({ ms: new Date(h.date).getTime(), volume: h.volume }))

  const now = Date.now()
  const currentAtl = atlAt(now, withMs, tau)

  // Serie histórica: ATL "como se hubiera visto" en cada sesión pasada
  const historicalSeries = withMs.map(h => atlAt(h.ms, withMs, tau)).sort((a, b) => a - b)

  const basedOnPersonalData = historicalSeries.length >= MIN_SESSIONS_FOR_PERSONAL_MAX
  const maxAtlP95 = basedOnPersonalData
    ? percentile(historicalSeries, 95)
    : historicalSeries[historicalSeries.length - 1] // bootstrap: única sesión = su propio 100%

  if (maxAtlP95 <= 0) return { score: 0, basedOnPersonalData }
  return { score: Math.min(100, (currentAtl / maxAtlP95) * 100), basedOnPersonalData }
}

function scoreToState(score: number): MuscleState {
  if (score >= SCORE_THRESHOLDS.exhausted_above)  return 'exhausted'
  if (score >= SCORE_THRESHOLDS.recovering_above) return 'recovering'
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

      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - HISTORY_WINDOW_DAYS)
      const fromStr = fromDate.toISOString().slice(0, 10)
      const recentCutoffMs = Date.now() - RECENT_SETS_WINDOW_DAYS * 24 * 60 * 60 * 1000

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
        setRecoveryData({})
        setLoading(false)
        return
      }

      // ── Acumular historial de volumen por músculo (por fecha) ───
      const muscleHistory: Record<string, Array<{ date: string; volume: number; sets: number }>> = {}
      const recentSetsByMuscle: Record<string, number> = {}

      for (const session of data as any[]) {
        const date: string = session.session_date
        const sessionMs = new Date(date).getTime()

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
          const existing = muscleHistory[bodymapId].find(h => h.date === date)
          if (existing) {
            existing.volume += sessionVolume
            existing.sets   += sessionSets
          } else {
            muscleHistory[bodymapId].push({ date, volume: sessionVolume, sets: sessionSets })
          }

          if (sessionMs >= recentCutoffMs) {
            recentSetsByMuscle[bodymapId] = (recentSetsByMuscle[bodymapId] ?? 0) + sessionSets
          }
        }
      }

      // ── Calcular score y estado por músculo ─────────────────
      const muscleMap: Record<string, MuscleRecovery> = {}

      for (const [bodymapId, history] of Object.entries(muscleHistory)) {
        const tau = TAU_BY_MUSCLE[bodymapId] ?? DEFAULT_TAU
        const { score, basedOnPersonalData } = computeATLScore(
          history.map(h => ({ date: h.date, volume: h.volume })),
          tau,
        )
        const state = scoreToState(score)
        const lastWorked = history.reduce((latest, h) => (h.date > latest ? h.date : latest), history[0].date)

        muscleMap[bodymapId] = {
          muscle_group: bodymapId,
          state,
          score: Math.round(score),
          last_worked: lastWorked,
          sets_done: recentSetsByMuscle[bodymapId] ?? 0,
          basedOnPersonalData,
        }
      }

      setRecoveryData(muscleMap)
      setLoading(false)
    }

    fetchRecovery()
  }, [userId])

  return { recoveryData, loading }
}
