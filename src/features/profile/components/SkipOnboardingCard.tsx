/* ============================================================
   SkipOnboardingCard.tsx — Tarjeta de omitir onboarding
   FASE 05.5 fix — GYM-YJMG
   Permite entrar a la app sin completar el perfil.
   ============================================================ */
import { SkipForward, Settings2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

type SkipOnboardingCardProps = {
  onSkip: () => void
  skipping: boolean
}

export function SkipOnboardingCard({ onSkip, skipping }: SkipOnboardingCardProps) {
  return (
    <div className="skip-card">
      <div className="skip-card__text">
        <p className="skip-card__hint">
          Puedes completar tu perfil después desde
        </p>
        <p className="skip-card__location">
          <Settings2 size={13} />
          Ajustes
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        loading={skipping}
        onClick={onSkip}
      >
        <SkipForward size={14} />
        Omitir por ahora
      </Button>
    </div>
  )
}
