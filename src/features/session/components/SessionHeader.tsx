/* ============================================================
   SessionHeader.tsx — Barra superior durante el entrenamiento
   FASE 03.2 — GYM-YJMG
   Responsabilidad: mostrar día, progreso, botón salir + toggle cola.
   ============================================================ */
import { X, ListOrdered } from 'lucide-react'
import { HelpVideoButton } from '../../../components/ui/HelpVideo/HelpVideoButton'
import './SessionHeader.css'

type SessionHeaderProps = {
  dayLabel: string
  currentIndex: number
  totalExercises: number
  onRequestExit: () => void
  onToggleQueue: () => void
  queueOpen: boolean
}

export function SessionHeader({
  dayLabel,
  currentIndex,
  totalExercises,
  onRequestExit,
  onToggleQueue,
  queueOpen,
}: SessionHeaderProps) {
  const progressPercent = totalExercises > 0
    ? (currentIndex / totalExercises) * 100
    : 0

  return (
    <header className="session-header">
      <div className="session-header__top">
        <div className="session-header__info">
          <span className="session-header__day">{dayLabel}</span>
          <span className="session-header__progress-text">
            Ejercicio {currentIndex + 1} de {totalExercises}
          </span>
        </div>

        <div className="session-header__actions">
          <button
            className={`session-header__queue-btn ${queueOpen ? 'session-header__queue-btn--active' : ''}`}
            onClick={onToggleQueue}
            aria-label={queueOpen ? 'Ver ejercicio actual' : 'Ver cola de ejercicios'}
            aria-pressed={queueOpen}
          >
            <ListOrdered size={18} />
          </button>

          <HelpVideoButton sectionKey="active_session" title="Tutorial: Entrenar" />

          <button
            className="session-header__exit"
            onClick={onRequestExit}
            aria-label="Salir del entrenamiento"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="session-header__progress-bar"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemax={totalExercises}
      >
        <div
          className="session-header__progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  )
}
