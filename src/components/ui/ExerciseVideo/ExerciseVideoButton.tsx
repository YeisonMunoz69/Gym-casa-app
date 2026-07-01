/* ============================================================
   ExerciseVideoButton.tsx — Botón discreto que abre el video de
   referencia del ejercicio (ExerciseVideoModal). Mismo patrón que
   HelpVideoButton, pero para el video privado del usuario.
   ============================================================ */
import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import { ExerciseVideoModal } from './ExerciseVideoModal'
import './ExerciseVideoButton.css'

type ExerciseVideoButtonProps = {
  exerciseId: string
  exerciseName: string
}

export function ExerciseVideoButton({ exerciseId, exerciseName }: ExerciseVideoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="exercise-video-btn"
        onClick={() => setOpen(true)}
        aria-label={`Ver video de referencia de ${exerciseName}`}
      >
        <Clapperboard size={14} />
        <span>Video</span>
      </button>

      {open && (
        <ExerciseVideoModal
          exerciseId={exerciseId}
          exerciseName={exerciseName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
