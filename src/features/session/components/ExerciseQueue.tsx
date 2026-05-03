/* ============================================================
   ExerciseQueue.tsx — Lista de ejercicios pendientes con reorden
   FASE 03.2 — GYM-YJMG
   Responsabilidad: muestra todos los ejercicios, marca el actual,
   permite subir/bajar en memoria (sin tocar BD).
   ============================================================ */
import { ChevronUp, ChevronDown, Dumbbell } from 'lucide-react'
import { useSessionStore } from '../../../stores/sessionStore'
import './ExerciseQueue.css'

export function ExerciseQueue() {
  const exercises = useSessionStore((s) => s.exercises)
  const currentIndex = useSessionStore((s) => s.currentExerciseIndex)
  const reorderExercises = useSessionStore((s) => s.reorderExercises)
  const navigateToExercise = useSessionStore((s) => s.navigateToExercise)

  function handleMoveUp(index: number) {
    if (index === 0) return
    reorderExercises(index, index - 1)
  }

  function handleMoveDown(index: number) {
    if (index === exercises.length - 1) return
    reorderExercises(index, index + 1)
  }

  return (
    <div className="exercise-queue">
      <p className="exercise-queue__title">Cola de ejercicios</p>
      <ul className="exercise-queue__list">
        {exercises.map((ex, index) => {
          const isCurrent = index === currentIndex
          const isPast = index < currentIndex
          return (
            <li
              key={ex.routineExerciseId}
              className={[
                'exercise-queue__item',
                isCurrent ? 'exercise-queue__item--current' : '',
                isPast ? 'exercise-queue__item--past' : '',
              ].filter(Boolean).join(' ')}
            >
              <button
                className="exercise-queue__item-body"
                onClick={() => navigateToExercise(index)}
                aria-label={`Ir a ${ex.name}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="exercise-queue__thumb">
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt="" className="exercise-queue__img" />
                  ) : (
                    <Dumbbell size={16} strokeWidth={1.5} />
                  )}
                </div>
                <div className="exercise-queue__info">
                  <span className="exercise-queue__name">{ex.name}</span>
                  <span className="exercise-queue__meta">
                    {ex.targetSets} series · {ex.repMin}–{ex.repMax} reps
                  </span>
                </div>
                {isCurrent && <span className="exercise-queue__badge">Ahora</span>}
                {ex.isBonus && <span className="exercise-queue__badge exercise-queue__badge--bonus">Bonus</span>}
              </button>

              <div className="exercise-queue__controls">
                <button
                  className="exercise-queue__ctrl-btn"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isCurrent}
                  aria-label="Mover arriba"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  className="exercise-queue__ctrl-btn"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === exercises.length - 1 || isCurrent}
                  aria-label="Mover abajo"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
