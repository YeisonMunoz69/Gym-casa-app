/* ============================================================
   OnboardingStep1.tsx — Paso 1: ¿Quién eres?
   Fix validación: nombre solo letras/espacios, fecha con rango.
   ============================================================ */
import { User, Calendar, ChevronRight, Mars, Venus, Circle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

type StepData = {
  full_name: string
  birth_date: string
  gender: 'male' | 'female' | 'other' | ''
}

type Props = {
  data: StepData
  onChange: (p: Partial<StepData>) => void
  onNext: () => void
}

type GenderOption = { value: StepData['gender']; label: string; Icon: LucideIcon }

const GENDERS: GenderOption[] = [
  { value: 'male',   label: 'Hombre', Icon: Mars },
  { value: 'female', label: 'Mujer',  Icon: Venus },
  { value: 'other',  label: 'Otro',   Icon: Circle },
]

/** Solo letras (incluyendo tildes y ñ) y espacios */
function sanitizeName(raw: string): string {
  return raw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 60)
}

/** Fecha en rango 1920 – (hoy - 10 años) */
function getDateLimits() {
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())
  return {
    min: '1920-01-01',
    max: maxDate.toISOString().split('T')[0],
  }
}

export function OnboardingStep1({ data, onChange, onNext }: Props) {
  const canNext = data.full_name.trim().length >= 2
  const { min, max } = getDateLimits()

  function handleNameChange(raw: string) {
    onChange({ full_name: sanitizeName(raw) })
  }

  function handleDateChange(value: string) {
    // Validar que la fecha esté dentro del rango antes de actualizar
    if (value && (value < min || value > max)) return
    onChange({ birth_date: value })
  }

  return (
    <div className="ob-step">
      <div className="ob-step__header">
        <div className="ob-step__icon-ring">
          <User size={28} />
        </div>
        <h2 className="ob-step__title">¿Quién eres?</h2>
        <p className="ob-step__subtitle">Cuéntanos un poco sobre ti para personalizar tu experiencia</p>
      </div>

      <div className="ob-step__fields">
        <div className="ob-step__field">
          <label className="ob-step__label" htmlFor="ob-name">
            Nombre completo *
            {data.full_name && data.full_name.trim().length < 2 && (
              <span className="ob-step__field-hint"> — mínimo 2 caracteres</span>
            )}
          </label>
          <input
            id="ob-name"
            className="ob-step__input"
            placeholder="Tu nombre"
            value={data.full_name}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={60}
            autoCapitalize="words"
            autoFocus
          />
        </div>

        <div className="ob-step__field">
          <label className="ob-step__label" htmlFor="ob-birth">Fecha de nacimiento</label>
          <div className="ob-step__input-icon-wrap">
            <Calendar size={16} className="ob-step__input-icon" />
            <input
              id="ob-birth"
              type="date"
              className="ob-step__input ob-step__input--padded"
              value={data.birth_date}
              min={min}
              max={max}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="ob-step__field">
          <span className="ob-step__label">Género</span>
          <div className="ob-step__chips">
            {GENDERS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={`ob-step__chip ${data.gender === value ? 'ob-step__chip--active' : ''}`}
                onClick={() => onChange({ gender: value })}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth disabled={!canNext} onClick={onNext}>
        Continuar
        <ChevronRight size={18} />
      </Button>
    </div>
  )
}
