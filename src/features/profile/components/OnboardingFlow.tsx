import { useState } from 'react'
import { useProfileStore } from '../../../stores/profileStore'
import { useAuthStore } from '../../../stores/authStore'
import { OnboardingStep1 } from './OnboardingStep1'
import { OnboardingStep2 } from './OnboardingStep2'
import { OnboardingStep3 } from './OnboardingStep3'
import { SkipOnboardingCard } from './SkipOnboardingCard'
import './OnboardingFlow.css'

type OnboardingData = {
  full_name: string
  birth_date: string
  gender: 'male' | 'female' | 'other' | ''
  height_cm: string
  initial_weight_kg: string
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance' | ''
  experience_level: 'beginner' | 'intermediate' | 'advanced' | ''
}

const INITIAL: OnboardingData = {
  full_name: '',
  birth_date: '',
  gender: '',
  height_cm: '',
  initial_weight_kg: '',
  goal: '',
  experience_level: '',
}

const STEP_LABELS = ['¿Quién eres?', 'Tu cuerpo', 'Tu nivel']

export function OnboardingFlow() {
  const userId = useAuthStore((s) => s.user?.id)
  const { saveProfile } = useProfileStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [saving, setSaving] = useState(false)

  function update(partial: Partial<OnboardingData>) {
    setData((d) => ({ ...d, ...partial }))
  }

  /** Omitir el onboarding — crea un perfil mínimo para entrar a la app */
  async function skip() {
    if (!userId) return
    setSaving(true)
    await saveProfile(userId, {
      full_name: null,
      birth_date: null,
      gender: null,
      height_cm: null,
      initial_weight_kg: null,
      goal: null,
      experience_level: null,
    })
    setSaving(false)
  }

  /** Guardar perfil completo al finalizar todos los pasos */
  async function finish() {
    if (!userId) return
    setSaving(true)
    await saveProfile(userId, {
      full_name: data.full_name || null,
      birth_date: data.birth_date || null,
      gender: data.gender || null,
      height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
      initial_weight_kg: data.initial_weight_kg ? parseFloat(data.initial_weight_kg) : null,
      goal: data.goal || null,
      experience_level: data.experience_level || null,
    })
    setSaving(false)
  }

  return (
    <div className="onboarding">
      <div className="onboarding__bg" />

      {/* Indicador de progreso */}
      <div className="onboarding__progress">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`onboarding__step-dot ${i === step ? 'onboarding__step-dot--active' : ''} ${i < step ? 'onboarding__step-dot--done' : ''}`}>
            <span className="onboarding__step-dot-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="onboarding__card">
        {step === 0 && (
          <OnboardingStep1
            data={data}
            onChange={update}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <OnboardingStep2
            data={data}
            onChange={update}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <OnboardingStep3
            data={data}
            onChange={update}
            onBack={() => setStep(1)}
            onFinish={finish}
            saving={saving}
          />
        )}
      </div>

      {/* Opción de omitir al fondo — siempre visible */}
      <SkipOnboardingCard onSkip={skip} skipping={saving && step < 2} />
    </div>
  )
}
