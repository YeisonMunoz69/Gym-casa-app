/* ============================================================
   RoutineDaysBar.tsx — Barra de selección y gestión de días de rutina
   FASE 05.5 — GYM-YJMG
   Responsabilidad: renderizar chips de días asignados y selector de nuevo día.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { Plus, X } from 'lucide-react'
import { WEEKDAY_LABELS } from '../../../types/routine'
import type { RoutineDayRow } from '../../../types/routine'

type RoutineDaysBarProps = {
  sortedDays: RoutineDayRow[]
  selectedDay: RoutineDayRow | null
  availableWeekdays: number[]
  onSelectDay: (day: RoutineDayRow) => void
  onRequestDeleteDay: (id: string, weekday: number) => void
  onSelectAddDay: (weekday: number) => void
}

export function RoutineDaysBar({
  sortedDays,
  selectedDay,
  availableWeekdays,
  onSelectDay,
  onRequestDeleteDay,
  onSelectAddDay,
}: RoutineDaysBarProps) {
  return (
    <div className="routine-detail__days-section">
      <h3 className="routine-detail__subtitle">Días asignados</h3>
      <div className="routine-detail__day-chips">
        {sortedDays.map((day) => (
          <button
            key={day.id}
            className={`day-chip ${selectedDay?.id === day.id ? 'day-chip--selected' : ''}`}
            onClick={() => onSelectDay(day)}
          >
            <span>{WEEKDAY_LABELS[day.weekday]}</span>
            <span
              className="day-chip__remove"
              role="button"
              tabIndex={0}
              aria-label={`Eliminar ${WEEKDAY_LABELS[day.weekday]}`}
              onClick={(e) => { e.stopPropagation(); onRequestDeleteDay(day.id, day.weekday) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRequestDeleteDay(day.id, day.weekday) } }}
            >
              <X size={12} />
            </span>
          </button>
        ))}

        {availableWeekdays.length > 0 && (
          <div className="routine-detail__add-day">
            <select
              className="routine-detail__day-select"
              value=""
              onChange={(e) => {
                const weekday = Number(e.target.value)
                onSelectAddDay(weekday)
              }}
            >
              <option value="" disabled>Agregar día...</option>
              {availableWeekdays.map((w) => (
                <option key={w} value={w}>{WEEKDAY_LABELS[w]}</option>
              ))}
            </select>
            <Plus size={14} className="routine-detail__add-icon" />
          </div>
        )}
      </div>
    </div>
  )
}
