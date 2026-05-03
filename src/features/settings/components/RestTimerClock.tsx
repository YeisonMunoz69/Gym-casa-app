/* ============================================================
   RestTimerClock.tsx — Reloj digital para el tiempo de descanso
   FASE 06 update — GYM-YJMG
   Reemplaza el selector de chips. Ajuste por +/- 30 segundos.
   Rango: 30s – 5 min. Sin emojis (SKILL-CODE §5.4).
   ============================================================ */
import { Timer, Plus, Minus } from 'lucide-react'
import './RestTimerClock.css'

const MIN_SECONDS = 30
const MAX_SECONDS = 300   // 5 min
const STEP        = 30

type RestTimerClockProps = {
  value: number          // segundos actuales
  saving: boolean
  onChange: (value: number) => void
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function describeTime(seconds: number): string {
  if (seconds < 60)  return `${seconds} segundos`
  if (seconds === 60)  return '1 minuto'
  if (seconds % 60 === 0) return `${seconds / 60} minutos`
  return `${Math.floor(seconds / 60)} min ${seconds % 60}s`
}

export function RestTimerClock({ value, saving, onChange }: RestTimerClockProps) {
  function decrease() {
    if (value > MIN_SECONDS) onChange(value - STEP)
  }

  function increase() {
    if (value < MAX_SECONDS) onChange(value + STEP)
  }

  return (
    <div className="rest-clock">
      <div className="rest-clock__header">
        <Timer size={16} className="rest-clock__header-icon" aria-hidden="true" />
        <span className="rest-clock__title">Descanso por defecto</span>
        {saving && <span className="rest-clock__saving">Guardando</span>}
      </div>

      <div className="rest-clock__display">
        <button
          className="rest-clock__btn rest-clock__btn--minus"
          onClick={decrease}
          disabled={saving || value <= MIN_SECONDS}
          aria-label="Reducir descanso 30 segundos"
        >
          <Minus size={20} />
        </button>

        <div className="rest-clock__digits" aria-live="polite" aria-label={`Tiempo de descanso: ${describeTime(value)}`}>
          <span className="rest-clock__time">{formatClock(value)}</span>
          <span className="rest-clock__unit">min : seg</span>
        </div>

        <button
          className="rest-clock__btn rest-clock__btn--plus"
          onClick={increase}
          disabled={saving || value >= MAX_SECONDS}
          aria-label="Aumentar descanso 30 segundos"
        >
          <Plus size={20} />
        </button>
      </div>

      <p className="rest-clock__hint">
        {describeTime(value)} de pausa entre sets — ajusta de 30 en 30 segundos.
      </p>
    </div>
  )
}
