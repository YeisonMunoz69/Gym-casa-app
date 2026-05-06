/* ============================================================
   RestTimer.tsx — Timer circular animado de descanso
   FASE 03.2 — GYM-YJMG
   Responsabilidad: SVG circle animado, play/pause, +15/+30s,
   sonido+vibración al terminar, persistencia en localStorage.
   ============================================================ */
import { useState } from 'react'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import { useRestTimer } from '../hooks/useRestTimer'
import { useTimerSound } from '../hooks/useTimerSound'
import { useTimerPersistence } from '../hooks/useTimerPersistence'
import './RestTimer.css'

type RestTimerProps = {
  defaultSeconds: number
  onFinish?: () => void   // Callback externo cuando el timer llega a 0
}

const CIRCLE_RADIUS = 54
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RestTimer({ defaultSeconds, onFinish: onFinishExternal }: RestTimerProps) {
  const { playTimerFinished, playCountdownBeep } = useTimerSound()
  const [flash, setFlash] = useState(false)

  function handleFinish() {
    playTimerFinished()
    setFlash(true)
    setTimeout(() => setFlash(false), 800)
    onFinishExternal?.()
  }

  function handleCountdown(secsLeft: number) {
    playCountdownBeep(secsLeft)
  }

  const { remaining, running, progress, start, pause, resume, reset, extend, mode } =
    useRestTimer(handleFinish, handleCountdown)

  // Persiste el timer ante recargas
  useTimerPersistence()

  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress)
  const isIdle = remaining === 0 && !running

  function handleStartOrPause() {
    if (isIdle) {
      start(defaultSeconds)
    } else if (running) {
      pause()
    } else {
      resume()
    }
  }

  const timerClass = [
    'rest-timer',
    running ? 'rest-timer--running' : '',
    flash ? 'rest-timer--flash' : '',
    mode === 'execution' ? 'rest-timer--execution' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={timerClass}>
      <div className="rest-timer__circle-wrap">
        <svg
          className="rest-timer__svg"
          viewBox="0 0 128 128"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary-light)" />
              <stop offset="100%" stopColor="var(--color-primary)" />
            </linearGradient>
            <linearGradient id="timer-gradient-exec" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(38, 92%, 60%)" />
              <stop offset="100%" stopColor="var(--color-warning)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle
            className="rest-timer__track"
            cx="64" cy="64"
            r={CIRCLE_RADIUS}
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="rest-timer__progress"
            cx="64" cy="64"
            r={CIRCLE_RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            stroke={mode === 'execution' ? "url(#timer-gradient-exec)" : "url(#timer-gradient)"}
            transform="rotate(-90 64 64)"
          />
        </svg>

        <div className="rest-timer__display">
          <span
            className="rest-timer__time"
            aria-live="polite"
            aria-label={`Descanso: ${formatTimerDisplay(remaining)}`}
          >
            {formatTimerDisplay(remaining)}
          </span>
          <span className="rest-timer__label">
            {mode === 'execution' ? 'en ejecución' : 'descanso'}
          </span>
        </div>
      </div>

      <div className="rest-timer__controls">
        <button
          className="rest-timer__btn rest-timer__btn--extend"
          onClick={() => extend(-15)}
          aria-label="Restar 15 segundos"
          disabled={isIdle || remaining === 0}
        >
          <Minus size={14} />
          <span>15s</span>
        </button>

        <button
          className="rest-timer__btn rest-timer__btn--primary"
          onClick={handleStartOrPause}
          aria-label={running ? 'Pausar descanso' : 'Iniciar descanso'}
        >
          {running ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
        </button>

        <button
          className="rest-timer__btn rest-timer__btn--extend"
          onClick={() => extend(15)}
          aria-label="Añadir 15 segundos"
          disabled={isIdle}
        >
          <Plus size={14} />
          <span>15s</span>
        </button>
      </div>

      <button
        className="rest-timer__reset"
        onClick={reset}
        aria-label="Reiniciar timer"
        disabled={isIdle}
      >
        <RotateCcw size={14} />
        <span>Reiniciar</span>
      </button>
    </div>
  )
}
