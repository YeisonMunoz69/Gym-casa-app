/* ============================================================
   useWeightSuggestion.ts — Conecta el LSTM con la sesión activa
   v2.0.0: retorna {suggestedWeight, suggestedReps} (multi-output)
   Responsabilidad: cargar el modelo, construir la ventana de sets
   y retornar la sugerencia + estado de los datos disponibles.

   CORRECCIONES APLICADAS (auditoría 2026-05-31):
   - B2: feature `position` corregida en buildDataPointsFromDrafts.
     Antes: setIndex / totalSets (rango 0–1 con denominador equivocado).
     Ahora: (setIndex + 1) / WINDOW_SIZE para coincidir con el esquema
     del entrenamiento: positions = np.arange(1, N+1) / WINDOW_SIZE.
   - B3: padWindow usa points[0] que, tras el fix B4 en ai.history.service,
     ya es el punto más ANTIGUO (orden ASC). El padding semánticamente
     correcto repite el contexto más antiguo al inicio de la ventana.
   - B6: suggestedWeight se resetea a null inmediatamente al re-ejecutarse
     el efecto (cambio de ejercicio, exerciseId, etc.) para evitar mostrar
     el peso del ejercicio anterior mientras se carga la nueva predicción.

   CAMBIO v2.0.0:
   - Usa predictNext() en vez de predictNextWeight()
   - Retorna suggestedReps además de suggestedWeight
   ============================================================ */
import { useState, useEffect, useRef, useMemo } from 'react'
import { loadLstmModel, predictNext } from '../../../services/ai.lstm.service'
import { fetchHistoricalSets } from '../../../services/ai.history.service'
import { useAuthStore } from '../../../stores/authStore'
import type { SetDraft } from '../../../types/session'
import type { SetDataPoint } from '../../../services/ai.lstm.service'

const WINDOW_SIZE = 8

export type SuggestionStatus = 'loading' | 'no-data' | 'partial' | 'full'

type UseWeightSuggestionReturn = {
  suggestedWeight: number | null
  suggestedReps: number | null   // v2.0: nuevo — reps predichas por el modelo
  status: SuggestionStatus
}

function buildDataPointsFromDrafts(
  drafts: SetDraft[],
  totalSets: number,
): SetDataPoint[] {
  // Se ignora `totalSets` desde la corrección B2 — el parámetro se mantiene
  // por compatibilidad de firma pero ya no se usa como denominador de position.
  void totalSets
  return drafts
    .filter((d) => d.completedAt !== null && d.weight !== null && d.reps !== null)
    .map((d) => ({
      weightKg: d.weight as number,
      reps: d.reps as number,
      // B2: (setIndex + 1) / WINDOW_SIZE coincide con el denominador del entrenamiento
      // (positions = arange(1, N+1) / WINDOW_SIZE). También usado en ai.history.service.
      position: (d.setIndex + 1) / WINDOW_SIZE,
    }))
}

function padWindow(points: SetDataPoint[]): SetDataPoint[] {
  if (points.length === 0) return []
  if (points.length >= WINDOW_SIZE) return points.slice(-WINDOW_SIZE)
  const padCount = WINDOW_SIZE - points.length
  // B3: el padding repite points[0], que tras el fix B4 (ai.history.service invierte
  // a orden ASC) ahora es el punto más ANTIGUO disponible. Repetir el contexto más
  // antiguo al inicio de la ventana es semánticamente correcto: simula "nada antes".
  const pad = Array<SetDataPoint>(padCount).fill(points[0])
  return [...pad, ...points]
}

export function useWeightSuggestion(
  completedDrafts: SetDraft[],
  exerciseId: string,
  totalSets: number,
): UseWeightSuggestionReturn {
  const [suggestedWeight, setSuggestedWeight] = useState<number | null>(null)
  const [suggestedReps, setSuggestedReps]     = useState<number | null>(null)  // v2.0
  const [status, setStatus]                   = useState<SuggestionStatus>('loading')
  const [modelReady, setModelReady]           = useState(false)
  const [modelFailed, setModelFailed]         = useState(false)
  const userId                                = useAuthStore((s) => s.user?.id ?? null)
  const modelLoadAttemptedRef                 = useRef(false)

  useEffect(() => {
    if (modelLoadAttemptedRef.current) return
    modelLoadAttemptedRef.current = true

    const timeoutId = window.setTimeout(() => {
      console.warn('[useWeightSuggestion] timeout cargando modelo LSTM (>8s)')
      setModelFailed(true)
    }, 8000)

    loadLstmModel()
      .then(() => {
        window.clearTimeout(timeoutId)
        setModelReady(true)
      })
      .catch((err) => {
        window.clearTimeout(timeoutId)
        console.error('[useWeightSuggestion] error cargando modelo LSTM:', err)
        setModelFailed(true)
      })
  }, [])

  const completedKey = useMemo(
    () => completedDrafts.map((d) => `${d.setIndex}:${d.weight ?? ''}:${d.reps ?? ''}`).join('|'),
    [completedDrafts],
  )

  useEffect(() => {
    if (modelFailed) {
      setStatus('no-data')
      setSuggestedWeight(null)
      setSuggestedReps(null)
      return
    }
    if (!modelReady || !userId || !exerciseId) {
      setStatus('loading')
      return
    }

    // B6: resetear inmediatamente al re-ejecutarse el efecto (cambio de ejercicio,
    // nueva serie completada, etc.). Sin esto, el peso/reps del ejercicio anterior
    // persiste visible mientras la nueva predicción carga.
    setSuggestedWeight(null)
    setSuggestedReps(null)

    const currentPoints = buildDataPointsFromDrafts(completedDrafts, totalSets)

    if (currentPoints.length >= WINDOW_SIZE) {
      const prediction = predictNext(currentPoints.slice(-WINDOW_SIZE))
      setSuggestedWeight(prediction?.weightKg ?? null)
      setSuggestedReps(prediction?.reps ?? null)
      setStatus('full')
      return
    }

    let cancelled = false
    setStatus('loading')

    fetchHistoricalSets(userId, exerciseId, WINDOW_SIZE * 2)
      .then((historical) => {
        if (cancelled) return
        const combined = [...historical, ...currentPoints]

        if (combined.length === 0) {
          setSuggestedWeight(null)
          setSuggestedReps(null)
          setStatus('no-data')
          return
        }

        const window     = padWindow(combined)
        const prediction = predictNext(window)
        setSuggestedWeight(prediction?.weightKg ?? null)
        setSuggestedReps(prediction?.reps ?? null)
        setStatus(combined.length >= WINDOW_SIZE ? 'full' : 'partial')
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestedWeight(null)
          setSuggestedReps(null)
          setStatus('no-data')
        }
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedKey, exerciseId, totalSets, userId, modelReady, modelFailed])

  return { suggestedWeight, suggestedReps, status }
}
