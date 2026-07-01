/* ============================================================
   SetRow.tsx — Fila de un set individual en SetTracker
   FASE 03 — GYM-YJMG
   Responsabilidad: inputs de peso/reps/RIR + botón completar.
   Al completar → llama onComplete. Al blur en input → llama onUpdate.
   ============================================================ */
import { useState, useEffect, useRef } from 'react'
import { Check, Play, Square } from 'lucide-react'
import { useSessionStore } from '../../../stores/sessionStore'
import { LastPerformanceChip } from './LastPerformanceChip'
import type { LastPerformanceStatus } from '../hooks/useLastPerformance'
import type { SetDraft } from '../../../types/session'
import './SetRow.css'

type SetRowProps = {
  draft: SetDraft
  isTimeBased?: boolean
  targetTimeSeconds?: number | null
  weightUnit?: string
  lastWeight?: number | null
  lastReps?: number | null           // último registro para este ejercicio
  lastPerformanceStatus?: LastPerformanceStatus
  onUpdate: (updated: SetDraft) => void
  onComplete: (updated: SetDraft) => void
  onUncomplete: (draft: SetDraft) => void
}

function parseNumericInput(raw: string): number | null {
  const n = parseFloat(raw)
  return isNaN(n) ? null : n
}

export function SetRow({ draft, isTimeBased, targetTimeSeconds, weightUnit = 'kg', lastWeight, lastReps, lastPerformanceStatus, onUpdate, onComplete, onUncomplete }: SetRowProps) {
  const [weight, setWeight] = useState(draft.weight?.toString() ?? '')
  const [reps, setReps] = useState(draft.reps?.toString() ?? '')
  const [rir, setRir] = useState(draft.rir?.toString() ?? '')
  const [durationSeconds, setDurationSeconds] = useState(draft.durationSeconds?.toString() ?? '')
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<number | null>(null)

  const startGlobalTimer = useSessionStore((s) => s.startTimer)
  const pauseGlobalTimer = useSessionStore((s) => s.pauseTimer)
  const isGlobalTimerRunning = useSessionStore((s) => s.timerRunning)
  const timerMode = useSessionStore((s) => s.timerMode)
  const wasRunningRef = useRef(false)

  const isCompleted = draft.completedAt !== null
  const setNumber = draft.setIndex + 1

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Sincroniza la pausa/reanudación desde el RestTimer global
  useEffect(() => {
    if (isRunning && !isGlobalTimerRunning) {
      wasRunningRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRunning(false)
    } else if (!isRunning && isGlobalTimerRunning && wasRunningRef.current && timerMode === 'execution') {
      wasRunningRef.current = false
      setIsRunning(true)
      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => {
          const current = parseInt(prev || '0', 10)
          return (current + 1).toString()
        })
      }, 1000) as unknown as number
    }
  }, [isGlobalTimerRunning, isRunning, timerMode]) // eslint-disable-line

  useEffect(() => {
    if (!isRunning && durationSeconds !== (draft.durationSeconds?.toString() ?? '')) {
      onUpdate({
        ...draft,
        weight: parseNumericInput(weight),
        reps: parseNumericInput(reps),
        rir: parseNumericInput(rir),
        durationSeconds: parseNumericInput(durationSeconds),
      })
    }
  }, [isRunning, durationSeconds]) // eslint-disable-line



  // Sync si el draft cambia externamente
  useEffect(() => {
    setWeight(draft.weight?.toString() ?? '')
    setReps(draft.reps?.toString() ?? '')
    setRir(draft.rir?.toString() ?? '')
    setDurationSeconds(draft.durationSeconds?.toString() ?? '')
  }, [draft.setIndex]) // eslint-disable-line

  // Autorellena peso y reps con el último registro del ejercicio
  function handleApplyLastPerformance(w: number, r: number | null) {
    setWeight(w.toString())
    if (r !== null && r > 0) setReps(r.toString())
    onUpdate({ ...draft, weight: w, reps: r !== null && r > 0 ? r : draft.reps })
  }

  function buildUpdatedDraft(explicitDuration?: string): SetDraft {
    return {
      ...draft,
      weight: parseNumericInput(weight),
      reps: parseNumericInput(reps),
      rir: parseNumericInput(rir),
      durationSeconds: parseNumericInput(explicitDuration !== undefined ? explicitDuration : durationSeconds),
    }
  }

  function handleBlur() {
    onUpdate(buildUpdatedDraft())
  }

  function handleComplete(explicitDuration?: string) {
    const updated: SetDraft = {
      ...buildUpdatedDraft(explicitDuration),
      completedAt: new Date().toISOString(),
    }
    onComplete(updated)
  }

  // Auto-completar cuando se alcanza el tiempo objetivo
  useEffect(() => {
    if (isRunning && targetTimeSeconds && parseInt(durationSeconds || '0', 10) >= targetTimeSeconds) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRunning(false)
      pauseGlobalTimer()
      handleComplete(durationSeconds)
    }
  }, [isRunning, durationSeconds, targetTimeSeconds]) // eslint-disable-line

  function toggleTimer() {
    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRunning(false)
      pauseGlobalTimer()
    } else {
      setIsRunning(true)
      const initialElapsed = parseInt(durationSeconds || '0', 10)
      startGlobalTimer(targetTimeSeconds || 60, 'execution', initialElapsed)
      
      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => {
          const current = parseInt(prev || '0', 10)
          return (current + 1).toString()
        })
      }, 1000) as unknown as number
    }
  }

  // Número visible: 'C1','C2'... para warmup; '1','2'... para work sets
  const displayNumber = draft.isWarmup
    ? `C${draft.setIndex + 1}`
    : `${setNumber}`

  const rowClass = [
    'set-row',
    isCompleted ? 'set-row--completed' : '',
    draft.isWarmup ? 'set-row--warmup' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rowClass}>
      <span className="set-row__number">{displayNumber}</span>

      <div className="set-row__inputs">
        <div className="set-row__weight-wrapper">
          <label className="set-row__field">
            <span className="set-row__field-label">{weightUnit}</span>
            <input
              className="set-row__input"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={handleBlur}
              placeholder="—"
              disabled={isCompleted}
              aria-label={`Peso serie ${setNumber}`}
            />
          </label>
        </div>

        {!isTimeBased ? (
          <>
            <label className="set-row__field">
              <span className="set-row__field-label">reps</span>
              <input
                className="set-row__input"
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onBlur={handleBlur}
                placeholder="—"
                disabled={isCompleted}
                aria-label={`Repeticiones serie ${setNumber}`}
              />
            </label>

            <label className="set-row__field">
              <span className="set-row__field-label">RIR</span>
              <input
                className="set-row__input set-row__input--rir"
                type="number"
                inputMode="numeric"
                value={rir}
                onChange={(e) => setRir(e.target.value)}
                onBlur={handleBlur}
                placeholder="—"
                disabled={isCompleted}
                aria-label={`RIR serie ${setNumber}`}
              />
            </label>
          </>
        ) : (
          <div className="set-row__time-wrapper">
            <button 
              className={`set-row__timer-btn ${isRunning ? 'running' : ''}`} 
              onClick={toggleTimer}
              disabled={isCompleted}
              title={isRunning ? "Detener" : "Iniciar"}
              aria-label={isRunning ? "Detener temporizador" : "Iniciar temporizador"}
            >
              {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <label className="set-row__field">
              <span className="set-row__field-label">tiempo (s)</span>
              <input
                className="set-row__input"
                type="number"
                inputMode="numeric"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                onBlur={handleBlur}
                placeholder={targetTimeSeconds ? targetTimeSeconds.toString() : "—"}
                disabled={isCompleted || isRunning}
                aria-label={`Tiempo serie ${setNumber}`}
              />
            </label>
          </div>
        )}
      </div>

      {/* Chip de último registro: fuera del weight-wrapper para no aumentar la altura
          de la columna KG y desplazar el botón de completar.
          Ocupa todo el ancho de los inputs como fila independiente. */}
      {!isCompleted && lastPerformanceStatus && (
        <div className="set-row__ai-row">
          <LastPerformanceChip
            lastWeight={lastWeight ?? null}
            lastReps={lastReps ?? null}
            status={lastPerformanceStatus}
            onApply={handleApplyLastPerformance}
            weightUnit={weightUnit}
          />
        </div>
      )}

      <button
        className={`set-row__complete-btn ${isCompleted ? 'set-row__complete-btn--active' : ''}`}
        onClick={() => isCompleted ? onUncomplete(draft) : handleComplete()}
        aria-label={isCompleted ? 'Desmarcar serie' : 'Marcar serie como completada'}
      >
        <Check size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
