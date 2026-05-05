import { useRef, useEffect, useState } from 'react'
import { Trash2, ChevronRight, Dumbbell, Copy } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { WEEKDAY_SHORT } from '../../../types/routine'
import type { RoutineWithDays } from '../../../types/routine'

type RoutineCardProps = {
  routine: RoutineWithDays
  onSelect: () => void
  onDelete: () => void
  onToggle: () => void
  onDuplicate: () => void
}

/** Mide si el texto del nombre desborda su contenedor y calcula el offset del marquee */
function useNameMarquee() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nameRef    = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing]   = useState(false)
  const [marqueeOffset, setMarqueeOffset]   = useState(0)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const name    = nameRef.current
    if (!wrapper || !name) return

    function measure() {
      const overflow = name!.scrollWidth - wrapper!.clientWidth
      if (overflow > 4) {
        setIsOverflowing(true)
        setMarqueeOffset(overflow)
      } else {
        setIsOverflowing(false)
        setMarqueeOffset(0)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  return { wrapperRef, nameRef, isOverflowing, marqueeOffset }
}

export function RoutineCard({ routine, onSelect, onDelete, onToggle, onDuplicate }: RoutineCardProps) {
  const { wrapperRef, nameRef, isOverflowing, marqueeOffset } = useNameMarquee()

  const dayChips = routine.routine_days
    .sort((a, b) => a.weekday - b.weekday)
    .map((d) => WEEKDAY_SHORT[d.weekday])

  const nameStyle = isOverflowing
    ? ({ '--marquee-offset': `-${marqueeOffset}px` } as React.CSSProperties)
    : undefined

  return (
    <Card variant="glass" padding="none" className="routine-card">
      <button className="routine-card__main" onClick={onSelect}>
        <div className="routine-card__svg-wrapper-1">
          <div className="routine-card__svg-wrapper">
            <Dumbbell size={24} className="routine-card__icon" />
            <span className="routine-card__edit-text">Editar</span>
          </div>
        </div>

        <div className="routine-card__content">
          <div className="routine-card__info">
            <div ref={wrapperRef} className="routine-card__name-wrapper">
              <span
                ref={nameRef}
                className={`routine-card__name${isOverflowing ? ' routine-card__name--marquee' : ''}`}
                style={nameStyle}
              >
                {routine.name}
              </span>
            </div>
            <div className="routine-card__days">
              {dayChips.length > 0
                ? dayChips.map((label) => (
                    <span key={label} className="routine-card__day-chip">{label}</span>
                  ))
                : <span className="routine-card__no-days">Sin dias asignados</span>}
            </div>
          </div>
          <ChevronRight size={18} className="routine-card__chevron" />
        </div>
      </button>

      <div className="routine-card__actions">
        <div>
          <input
            className="routine-switch__input"
            id={`switch-${routine.id}`}
            type="checkbox"
            checked={routine.is_active}
            onChange={onToggle}
          />
          <label
            className="routine-switch"
            htmlFor={`switch-${routine.id}`}
            aria-label={routine.is_active ? 'Desactivar rutina' : 'Activar rutina'}
            title={routine.is_active ? 'Desactivar rutina' : 'Activar rutina'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="slider">
              <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"></path>
            </svg>
          </label>
        </div>
        <button
          type="button"
          className="routine-clone-btn"
          aria-label="Duplicar rutina"
          title="Duplicar rutina"
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
        >
          <Copy strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="routine-delete-btn"
          aria-label="Eliminar rutina"
          title="Eliminar rutina"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 strokeWidth={2.5} />
        </button>
      </div>
    </Card>
  )
}
