/* ============================================================
   ExerciseHeroCard.tsx — Ejercicio actual dominando la pantalla
   FASE 03 — GYM-YJMG
   Responsabilidad: imagen grande + nombre + músculo + parámetros objetivo.
   ============================================================ */
import { Dumbbell, Target, RotateCcw } from 'lucide-react'
import { ExerciseVideoButton } from '../../../components/ui/ExerciseVideo/ExerciseVideoButton'
import type { SessionExerciseItem } from '../../../types/session'
import './ExerciseHeroCard.css'

type ExerciseHeroCardProps = {
  exercise: SessionExerciseItem
  setsCompleted: number
}

function buildRepsLabel(repMin: number, repMax: number): string {
  if (repMin === repMax) return `${repMin} reps`
  return `${repMin}–${repMax} reps`
}

export function ExerciseHeroCard({ exercise, setsCompleted }: ExerciseHeroCardProps) {
  const totalSets = exercise.warmupSets + exercise.targetSets
  const repsLabel = buildRepsLabel(exercise.repMin, exercise.repMax)

  return (
    <div className="exercise-hero">
      <div className="exercise-hero__image-wrap">
        {exercise.imageUrl ? (
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="exercise-hero__image"
            loading="lazy"
          />
        ) : (
          <div className="exercise-hero__image-placeholder">
            <Dumbbell size={52} strokeWidth={1.2} />
          </div>
        )}
        <div className="exercise-hero__image-overlay" />
        <div className="exercise-hero__image-meta">
          <span className="exercise-hero__muscle">{exercise.muscleGroup}</span>
        </div>
      </div>

      <div className="exercise-hero__body">
        <div className="exercise-hero__name-row">
          <h2 className="exercise-hero__name">{exercise.name}</h2>
          <ExerciseVideoButton exerciseId={exercise.exerciseId} exerciseName={exercise.name} />
        </div>

        <div className="exercise-hero__params">
          <div className="exercise-hero__param">
            <Target size={14} />
            <span>{repsLabel}</span>
          </div>
          <div className="exercise-hero__param">
            <RotateCcw size={14} />
            <span>RIR {exercise.rirTarget}</span>
          </div>
          <div className="exercise-hero__param exercise-hero__param--sets">
            <span className="exercise-hero__sets-done">{setsCompleted}</span>
            <span className="exercise-hero__sets-sep">/</span>
            <span className="exercise-hero__sets-total">{totalSets}</span>
            <span className="exercise-hero__sets-label">series</span>
          </div>
        </div>

        {exercise.notes && (
          <p className="exercise-hero__notes">{exercise.notes}</p>
        )}
      </div>
    </div>
  )
}
