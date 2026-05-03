/* ============================================================
   NextExercisePeek.tsx — Preview sutil del siguiente ejercicio
   FASE 03 — GYM-YJMG
   Responsabilidad: muestra thumbnail + nombre del próximo ejercicio.
   ============================================================ */
import { ArrowRight, Dumbbell } from 'lucide-react'
import type { SessionExerciseItem } from '../../../types/session'
import './NextExercisePeek.css'

type NextExercisePeekProps = {
  exercise: SessionExerciseItem
  onClick: () => void
}

export function NextExercisePeek({ exercise, onClick }: NextExercisePeekProps) {
  return (
    <button className="next-peek" onClick={onClick} aria-label={`Ir al siguiente ejercicio: ${exercise.name}`}>
      <div className="next-peek__thumb">
        {exercise.imageUrl ? (
          <img src={exercise.imageUrl} alt={exercise.name} className="next-peek__img" />
        ) : (
          <Dumbbell size={20} strokeWidth={1.5} className="next-peek__icon" />
        )}
      </div>
      <div className="next-peek__info">
        <span className="next-peek__label">Siguiente</span>
        <span className="next-peek__name">{exercise.name}</span>
        <span className="next-peek__muscle">{exercise.muscleGroup}</span>
      </div>
      <ArrowRight size={18} className="next-peek__arrow" />
    </button>
  )
}
