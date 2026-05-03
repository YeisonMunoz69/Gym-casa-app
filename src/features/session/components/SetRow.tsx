/* ============================================================
   SetRow.tsx — Fila de un set individual en SetTracker
   FASE 03 — GYM-YJMG
   Responsabilidad: inputs de peso/reps/RIR + botón completar.
   Al completar → llama onComplete. Al blur en input → llama onUpdate.
   ============================================================ */
import { useState, useEffect, useRef } from 'react'
import { Check, Play, Square } from 'lucide-react'
import { useSessionStore } from '../../../stores/sessionStore'
import type { SetDraft } from '../../../types/session'
import './SetRow.css'

type SetRowProps = {
  draft: SetDraft
  isTimeBased?: boolean
  targetTimeSeconds?: number | null
  weightUnit?: string
  onUpdate: (updated: SetDraft) => void
  onComplete: (updated: SetDraft) => void
}

function parseNumericInput(raw: string): number | null {
  const n = parseFloat(raw)
  return isNaN(n) ? null : n
}

export function SetRow({ draft, isTimeBased, targetTimeSeconds, weightUnit = 'kg', onUpdate, onComplete }: SetRowProps) {
  const [weight, setWeight] = useState(draft.weight?.toString() ?? '')
  const [reps, setReps] = useState(draft.reps?.toString() ?? '')
  const [rir, setRir] = useState(draft.rir?.toString() ?? '')
  const [durationSeconds, setDurationSeconds] = useState(draft.durationSeconds?.toString() ?? '')
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<number | null>(null)

  const startGlobalTimer = useSessionStore((s) => s.startTimer)
  const pauseGlobalTimer = useSessionStore((s) => s.pauseTimer)

  const isCompleted = draft.completedAt !== null
  const setNumber = draft.setIndex + 1

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

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
                placeholder="—"
                disabled={isCompleted || isRunning}
                aria-label={`Tiempo serie ${setNumber}`}
              />
            </label>
          </div>
        )}
      </div>

      <button
        className="set-row__complete-btn"
        onClick={() => handleComplete()}
        disabled={isCompleted}
        aria-label={isCompleted ? 'Serie completada' : 'Marcar serie como completada'}
      >
        <Check size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
