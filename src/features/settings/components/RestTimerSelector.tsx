/* ============================================================
   RestTimerSelector.tsx — Selector del temporizador de descanso
   FASE 05 — GYM-YJMG
   Responsabilidad: UI interactiva para elegir duración de descanso.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { Timer } from 'lucide-react'
import { REST_TIMER_OPTIONS } from '../../../types/settings'
import type { RestTimerOption } from '../../../types/settings'
import './RestTimerSelector.css'

type RestTimerSelectorProps = {
  value: number
  saving: boolean
  onChange: (value: RestTimerOption) => void
}

export function RestTimerSelector({ value, saving, onChange }: RestTimerSelectorProps) {
  return (
    <div className="rest-timer-selector">
      <div className="rest-timer-selector__header">
        <Timer size={18} className="rest-timer-selector__icon" aria-hidden="true" />
        <span className="rest-timer-selector__title">Descanso por defecto</span>
        {saving && <span className="rest-timer-selector__saving">Guardando…</span>}
      </div>

      <div className="rest-timer-selector__grid" role="radiogroup" aria-label="Duración de descanso">
        {REST_TIMER_OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={isSelected}
              disabled={saving}
              className={`rest-timer-option ${isSelected ? 'rest-timer-option--active' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              <span className="rest-timer-option__label">{opt.label}</span>
              {isSelected && (
                <span className="rest-timer-option__glow" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      <p className="rest-timer-selector__hint">
        Tiempo de pausa que inicia automáticamente al completar un set.
      </p>
    </div>
  )
}
