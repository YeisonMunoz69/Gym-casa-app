/* ============================================================
   OnboardingStep2.tsx — Paso 2: Tu cuerpo
   Fix validación: altura/peso con clamp en blur, no permite
   valores fuera del rango ni decimales inválidos.
   ============================================================ */
import { Ruler, Weight, Target, ChevronRight, ArrowLeft, Flame, Dumbbell, Scale, Gauge, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

type StepData = {
  height_cm: string
  initial_weight_kg: string
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance' | ''
}

type Props = {
  data: StepData
  onChange: (p: Partial<StepData>) => void
  onBack: () => void
  onNext: () => void
}

type GoalOption = { value: StepData['goal']; Icon: LucideIcon; label: string; desc: string }

const GOALS: GoalOption[] = [
  { value: 'lose_weight', Icon: Flame,    label: 'Perder peso',   desc: 'Quemar grasa corporal' },
  { value: 'gain_muscle', Icon: Dumbbell, label: 'Ganar músculo', desc: 'Hipertrofia y fuerza' },
  { value: 'maintain',    Icon: Scale,    label: 'Mantener',      desc: 'Estilo de vida activo' },
  { value: 'strength',    Icon: Gauge,    label: 'Fuerza máxima', desc: 'Levantamiento pesado' },
  { value: 'endurance',   Icon: Activity, label: 'Resistencia',   desc: 'Cardio y condición' },
]

const HEIGHT_MIN = 100
const HEIGHT_MAX = 250
const WEIGHT_MIN = 30
const WEIGHT_MAX = 300

/** Clamp y redondeo al dejar el campo */
function clampHeight(raw: string): string {
  const n = parseFloat(raw)
  if (isNaN(n) || raw === '') return ''
  return String(Math.round(Math.min(Math.max(n, HEIGHT_MIN), HEIGHT_MAX)))
}

function clampWeight(raw: string): string {
  const n = parseFloat(raw)
  if (isNaN(n) || raw === '') return ''
  const clamped = Math.min(Math.max(n, WEIGHT_MIN), WEIGHT_MAX)
  return String(Math.round(clamped * 2) / 2) // redondear a 0.5
}

/** Solo dígitos y un decimal opcional */
function sanitizeNumber(raw: string): string {
  return raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
}

export function OnboardingStep2({ data, onChange, onBack, onNext }: Props) {
  const heightVal = parseFloat(data.height_cm)
  const weightVal = parseFloat(data.initial_weight_kg)

  const heightOk = !isNaN(heightVal) && heightVal >= HEIGHT_MIN && heightVal <= HEIGHT_MAX
  const weightOk = !isNaN(weightVal) && weightVal >= WEIGHT_MIN && weightVal <= WEIGHT_MAX
  const canNext   = heightOk && weightOk

  const heightError = data.height_cm && !heightOk
    ? `Entre ${HEIGHT_MIN} y ${HEIGHT_MAX} cm` : null
  const weightError = data.initial_weight_kg && !weightOk
    ? `Entre ${WEIGHT_MIN} y ${WEIGHT_MAX} kg` : null

  return (
    <div className="ob-step">
      <div className="ob-step__header">
        <div className="ob-step__icon-ring"><Ruler size={28} /></div>
        <h2 className="ob-step__title">Tu cuerpo</h2>
        <p className="ob-step__subtitle">Estos datos nos permiten calcular métricas personalizadas</p>
      </div>

      <div className="ob-step__fields">
        <div className="ob-step__row">
          <div className="ob-step__field">
            <label className="ob-step__label" htmlFor="ob-height">
              Altura (cm) *
              {heightError && <span className="ob-step__field-error"> — {heightError}</span>}
            </label>
            <div className="ob-step__input-icon-wrap">
              <Ruler size={16} className="ob-step__input-icon" />
              <input
                id="ob-height"
                type="number"
                inputMode="numeric"
                className={`ob-step__input ob-step__input--padded ${heightError ? 'ob-step__input--error' : ''}`}
                placeholder="ej: 175"
                min={HEIGHT_MIN} max={HEIGHT_MAX}
                value={data.height_cm}
                onChange={(e) => onChange({ height_cm: sanitizeNumber(e.target.value) })}
                onBlur={(e) => onChange({ height_cm: clampHeight(e.target.value) })}
              />
            </div>
          </div>

          <div className="ob-step__field">
            <label className="ob-step__label" htmlFor="ob-weight">
              Peso (kg) *
              {weightError && <span className="ob-step__field-error"> — {weightError}</span>}
            </label>
            <div className="ob-step__input-icon-wrap">
              <Weight size={16} className="ob-step__input-icon" />
              <input
                id="ob-weight"
                type="number"
                inputMode="decimal"
                className={`ob-step__input ob-step__input--padded ${weightError ? 'ob-step__input--error' : ''}`}
                placeholder="ej: 75"
                min={WEIGHT_MIN} max={WEIGHT_MAX}
                step={0.5}
                value={data.initial_weight_kg}
                onChange={(e) => onChange({ initial_weight_kg: sanitizeNumber(e.target.value) })}
                onBlur={(e) => onChange({ initial_weight_kg: clampWeight(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="ob-step__field">
          <div className="ob-step__label-row">
            <Target size={14} />
            <span className="ob-step__label">Mi objetivo principal</span>
          </div>
          <div className="ob-step__goal-grid">
            {GOALS.map(({ value, Icon, label, desc }) => (
              <button
                key={value}
                type="button"
                className={`ob-step__goal-card ${data.goal === value ? 'ob-step__goal-card--active' : ''}`}
                onClick={() => onChange({ goal: value })}
              >
                <Icon size={18} className="ob-step__goal-icon" />
                <span className="ob-step__goal-label">{label}</span>
                <span className="ob-step__goal-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ob-step__actions">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft size={18} />
        </Button>
        <Button variant="primary" size="lg" fullWidth disabled={!canNext} onClick={onNext}>
          Continuar
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  )
}
