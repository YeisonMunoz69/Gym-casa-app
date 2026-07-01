/* ============================================================
   SessionHeaderTimer.tsx — Timer de descanso, vive siempre en SessionHeader
   Reemplaza RestTimer.tsx (que estaba inline en el cuerpo) + el
   CompactTimer que aparecía solo al hacer scroll. Ahora es la ÚNICA
   instancia con sonido/vibración/auto-avance (antes duplicada entre
   RestTimer.tsx y el compact timer del header).
   Responsabilidad: anillo circular + controles (−15/play-pausa/+15/reset),
   tamaño interpolado continuamente por `collapseProgress` (0=arriba del
   todo/expandido, 1=scrolleado/colapsado) en vez de un toggle binario.
   ============================================================ */
import { useState } from 'react'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import { useRestTimer } from '../hooks/useRestTimer'
import { useTimerSound } from '../hooks/useTimerSound'
import { useTimerPersistence } from '../hooks/useTimerPersistence'
import { formatTimerDisplay } from '../../../utils/formatTimerDisplay'
import './SessionHeaderTimer.css'

type SessionHeaderTimerProps = {
  onFinish?: () => void
  /** 0 = header expandido (arriba del todo), 1 = header colapsado (scrolleado) */
  collapseProgress: number
}

const CIRCLE_RADIUS = 54
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

export function SessionHeaderTimer({ onFinish: onFinishExternal, collapseProgress }: SessionHeaderTimerProps) {
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

  const { remaining, running, progress, pause, resume, reset, extend, mode } =
    useRestTimer(handleFinish, handleCountdown)

  // Persiste el timer ante recargas y resincroniza al volver de segundo plano
  useTimerPersistence()

  const isIdle = remaining === 0 && !running
  if (isIdle) return null

  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress)
  const circleSize = lerp(88, 52, collapseProgress)
  const svgSize = circleSize + 8
  const timeFontSize = lerp(22, 14, collapseProgress)
  const primaryBtnSize = lerp(44, 30, collapseProgress)
  const extendBtnSize = lerp(36, 26, collapseProgress)
  const iconSize = lerp(18, 12, collapseProgress)
  const extendIconSize = lerp(12, 9, collapseProgress)
  const showLabel = collapseProgress < 0.5

  function handleStartOrPause() {
    if (running) pause()
    else resume()
  }

  const timerClass = [
    'header-timer',
    running ? 'header-timer--running' : '',
    flash ? 'header-timer--flash' : '',
    mode === 'execution' ? 'header-timer--execution' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={timerClass}>
      <div className="header-timer__circle-wrap" style={{ width: circleSize, height: circleSize }}>
        <svg
          className="header-timer__svg"
          width={svgSize}
          height={svgSize}
          viewBox="0 0 128 128"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="header-timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary-light)" />
              <stop offset="100%" stopColor="var(--color-primary)" />
            </linearGradient>
            <linearGradient id="header-timer-gradient-exec" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(38, 92%, 60%)" />
              <stop offset="100%" stopColor="var(--color-warning)" />
            </linearGradient>
          </defs>
          <circle
            className="header-timer__track"
            cx="64" cy="64"
            r={CIRCLE_RADIUS}
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="header-timer__progress"
            cx="64" cy="64"
            r={CIRCLE_RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            stroke={mode === 'execution' ? 'url(#header-timer-gradient-exec)' : 'url(#header-timer-gradient)'}
            transform="rotate(-90 64 64)"
          />
        </svg>

        <div className="header-timer__display">
          <span
            className="header-timer__time"
            style={{ fontSize: timeFontSize }}
            aria-live="polite"
            aria-label={`Descanso: ${formatTimerDisplay(remaining)}`}
          >
            {formatTimerDisplay(remaining)}
          </span>
          {showLabel && (
            <span className="header-timer__label">
              {mode === 'execution' ? 'en ejecución' : 'descanso'}
            </span>
          )}
        </div>
      </div>

      <div className="header-timer__controls">
        <button
          className="header-timer__btn header-timer__btn--extend"
          style={{ width: extendBtnSize, height: extendBtnSize }}
          onClick={() => extend(-15)}
          aria-label="Restar 15 segundos"
          disabled={remaining === 0}
        >
          <Minus size={extendIconSize} />
        </button>

        <button
          className="header-timer__btn header-timer__btn--primary"
          style={{ width: primaryBtnSize, height: primaryBtnSize }}
          onClick={handleStartOrPause}
          aria-label={running ? 'Pausar descanso' : 'Reanudar descanso'}
        >
          {running ? <Pause size={iconSize} /> : <Play size={iconSize} fill="currentColor" />}
        </button>

        <button
          className="header-timer__btn header-timer__btn--extend"
          style={{ width: extendBtnSize, height: extendBtnSize }}
          onClick={() => extend(15)}
          aria-label="Añadir 15 segundos"
        >
          <Plus size={extendIconSize} />
        </button>

        <button
          className="header-timer__btn header-timer__btn--reset"
          style={{ width: extendBtnSize, height: extendBtnSize }}
          onClick={reset}
          aria-label="Reiniciar timer"
        >
          <RotateCcw size={extendIconSize} />
        </button>
      </div>
    </div>
  )
}
