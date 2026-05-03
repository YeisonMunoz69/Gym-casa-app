import { Zap, ArrowLeft, Trophy, Leaf, Flame, Rocket } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

type StepData = {
  experience_level: 'beginner' | 'intermediate' | 'advanced' | ''
}

type Props = {
  data: StepData
  onChange: (p: Partial<StepData>) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
}

type LevelOption = {
  value: StepData['experience_level']
  Icon: LucideIcon
  label: string
  desc: string
  color: string
}

const LEVELS: LevelOption[] = [
  {
    value: 'beginner',
    Icon: Leaf,
    label: 'Principiante',
    desc: 'Llevo menos de 1 año entrenando o acabo de empezar',
    color: 'var(--color-success)',
  },
  {
    value: 'intermediate',
    Icon: Flame,
    label: 'Intermedio',
    desc: 'Entreno regularmente hace 1-3 años con técnica consolidada',
    color: 'var(--color-warning)',
  },
  {
    value: 'advanced',
    Icon: Zap,
    label: 'Avanzado',
    desc: 'Más de 3 años de entrenamiento serio y consistente',
    color: 'var(--color-primary)',
  },
]

export function OnboardingStep3({ data, onChange, onBack, onFinish, saving }: Props) {
  const canFinish = data.experience_level !== ''

  return (
    <div className="ob-step">
      <div className="ob-step__header">
        <div className="ob-step__icon-ring">
          <Zap size={28} />
        </div>
        <h2 className="ob-step__title">Tu nivel</h2>
        <p className="ob-step__subtitle">Sé honesto, esto solo nos ayuda a darte mejores sugerencias</p>
      </div>

      <div className="ob-step__fields">
        <div className="ob-step__level-list">
          {LEVELS.map(({ value, Icon, label, desc, color }) => (
            <button
              key={value}
              type="button"
              className={`ob-step__level-card ${data.experience_level === value ? 'ob-step__level-card--active' : ''}`}
              style={{ '--level-color': color } as React.CSSProperties}
              onClick={() => onChange({ experience_level: value })}
            >
              <div className="ob-step__level-icon-wrap">
                <Icon size={22} />
              </div>
              <div className="ob-step__level-text">
                <span className="ob-step__level-label">{label}</span>
                <span className="ob-step__level-desc">{desc}</span>
              </div>
              {data.experience_level === value && (
                <Trophy size={16} className="ob-step__level-check" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="ob-step__actions">
        <Button variant="ghost" size="lg" onClick={onBack} disabled={saving}>
          <ArrowLeft size={18} />
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canFinish || saving}
          onClick={onFinish}
        >
          {saving ? (
            <HamsterLoader size={30} />
          ) : (
            <Rocket size={18} />
          )}
          {saving ? 'Guardando...' : '¡Empezar a entrenar!'}
        </Button>
      </div>
    </div>
  )
}
