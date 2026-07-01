/* ============================================================
   SetTracker.tsx — Lista de sets de un ejercicio con autoguardado
   FASE 03 — GYM-YJMG
   Responsabilidad: renderiza SetRows y coordina autoguardado por blur.
   ============================================================ */
import { ListChecks } from 'lucide-react'
import { useSessionStore } from '../../../stores/sessionStore'
import { useSetAutoSave } from '../hooks/useSetAutoSave'
import { useLastPerformance } from '../hooks/useLastPerformance'
import { SetRow } from './SetRow'
import { useSettings } from '../../settings/hooks/useSettings'
import type { SessionExerciseItem, SetDraft } from '../../../types/session'
import './SetTracker.css'

type SetTrackerProps = {
  exercise: SessionExerciseItem
  onSetCompleted: () => void
}

export function SetTracker({ exercise, onSetCompleted }: SetTrackerProps) {
  const sets = useSessionStore((s) => s.sets[exercise.routineExerciseId] ?? [])
  const completeSet = useSessionStore((s) => s.completeSet)
  const uncompleteSet = useSessionStore((s) => s.uncompleteSet)
  const { saveSet } = useSetAutoSave()
  const { settings } = useSettings()
  const weightUnit = settings?.unit_system === 'imperial' ? 'lb' : 'kg'

  const workSets = sets.filter((s) => !s.isWarmup)
  const warmupSets = sets.filter((s) => s.isWarmup)

  const { lastWeight, lastReps, status: lastPerformanceStatus } = useLastPerformance(exercise.exerciseId)

  function handleUpdate(draft: SetDraft) {
    saveSet(exercise.routineExerciseId, draft)
  }

  function handleComplete(draft: SetDraft) {
    completeSet(exercise.routineExerciseId, draft.setIndex)
    saveSet(exercise.routineExerciseId, { ...draft, completedAt: new Date().toISOString() })
    onSetCompleted()
  }

  function handleUncomplete(draft: SetDraft) {
    uncompleteSet(exercise.routineExerciseId, draft.setIndex)
    saveSet(exercise.routineExerciseId, { ...draft, completedAt: null })
  }

  return (
    <div className="set-tracker">
      <div className="set-tracker__header">
        <ListChecks size={16} />
        <span>Series</span>
      </div>

      {warmupSets.length > 0 && (
        <div className="set-tracker__group">
          <span className="set-tracker__group-label">Calentamiento</span>
          {warmupSets.map((draft) => (
            <SetRow
              key={`${exercise.routineExerciseId}-${draft.setIndex}`}
              draft={draft}
              isTimeBased={exercise.isTimeBased}
              targetTimeSeconds={exercise.targetTimeSeconds}
              weightUnit={weightUnit}
              onUpdate={handleUpdate}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
            />
          ))}
        </div>
      )}

      <div className="set-tracker__group">
        {warmupSets.length > 0 && (
          <span className="set-tracker__group-label">Trabajo</span>
        )}
        {workSets.map((draft) => (
          <SetRow
            key={`${exercise.routineExerciseId}-${draft.setIndex}`}
            draft={draft}
            isTimeBased={exercise.isTimeBased}
            targetTimeSeconds={exercise.targetTimeSeconds}
            weightUnit={weightUnit}
            lastWeight={draft.completedAt === null ? lastWeight : null}
            lastReps={draft.completedAt === null ? lastReps : null}
            lastPerformanceStatus={lastPerformanceStatus}
            onUpdate={handleUpdate}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
          />
        ))}
      </div>
    </div>
  )
}
