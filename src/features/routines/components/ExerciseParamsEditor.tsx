import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { ExerciseVideoButton } from '../../../components/ui/ExerciseVideo/ExerciseVideoButton'
import type { RoutineExerciseWithDetails } from '../../../types/routine'
import './ExerciseParamsEditor.css'

type ExerciseParamsEditorProps = {
  exercise: RoutineExerciseWithDetails
  onSave: (params: ParamValues) => Promise<void>
  onClose: () => void
}

export type ParamValues = {
  target_sets: number
  rep_min: number
  rep_max: number
  rir_target: number
  rest_seconds: number
  rest_between_exercises_seconds: number
  warmup_sets: number
  notes: string
  is_time_based: boolean
  target_time_seconds: number | null
}

export function ExerciseParamsEditor({ exercise, onSave, onClose }: ExerciseParamsEditorProps) {
  const [values, setValues] = useState<ParamValues>({
    target_sets: exercise.target_sets,
    rep_min: exercise.rep_min,
    rep_max: exercise.rep_max,
    rir_target: exercise.rir_target,
    rest_seconds: exercise.rest_seconds,
    rest_between_exercises_seconds: exercise.rest_between_exercises_seconds,
    warmup_sets: exercise.warmup_sets,
    notes: exercise.notes ?? '',
    is_time_based: exercise.is_time_based ?? false,
    target_time_seconds: exercise.target_time_seconds ?? 60,
  })
  const [saving, setSaving] = useState(false)

  function updateField<K extends keyof ParamValues>(key: K, value: ParamValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(values)
    setSaving(false)
  }

  return (
    <div className="params-overlay" onClick={onClose}>
      <div className="params-editor" onClick={(e) => e.stopPropagation()}>
        <div className="params-editor__header">
          <h3 className="params-editor__title">{exercise.exercise.name}</h3>
          <div className="params-editor__header-actions">
            <ExerciseVideoButton exerciseId={exercise.exercise.id} exerciseName={exercise.exercise.name} />
            <IconButton icon={X} ariaLabel="Cerrar" size="sm" onClick={onClose} />
          </div>
        </div>

        <div className="params-editor__grid">
          <NumberField label="Series" value={values.target_sets} min={1} max={10}
            onChange={(v) => updateField('target_sets', v)} />
          <NumberField label="Warmup" value={values.warmup_sets} min={0} max={5}
            onChange={(v) => updateField('warmup_sets', v)} />

          {!values.is_time_based ? (
            <>
              <NumberField label="Rep min" value={values.rep_min} min={1} max={50}
                onChange={(v) => updateField('rep_min', v)} />
              <NumberField label="Rep max" value={values.rep_max} min={values.rep_min} max={50}
                onChange={(v) => updateField('rep_max', v)} />
              <NumberField label="RIR" value={values.rir_target} min={0} max={5} step={0.5}
                onChange={(v) => updateField('rir_target', v)} />
            </>
          ) : (
            <NumberField label="Tiempo obj. (s)" value={values.target_time_seconds || 60} min={15} max={3600} step={15}
              onChange={(v) => updateField('target_time_seconds', v)} />
          )}

          <NumberField label="Descanso (s)" value={values.rest_seconds} min={5} max={600} step={5}
            onChange={(v) => updateField('rest_seconds', v)} />
        </div>

        <NumberField
          label="Descanso entre ejercicios (s)"
          value={values.rest_between_exercises_seconds}
          min={5}
          max={600}
          step={5}
          onChange={(v) => updateField('rest_between_exercises_seconds', v)}
        />

        <div className="params-editor__toggle-row">
          <span className="params-editor__label">Medir por tiempo (cardio)</span>
          <label className="params-switch">
            <input
              type="checkbox"
              className="params-switch__input"
              checked={values.is_time_based}
              onChange={(e) => updateField('is_time_based', e.target.checked)}
            />
            <span className="params-switch__slider"></span>
          </label>
        </div>

        <div className="params-editor__field">
          <label className="params-editor__label">Notas</label>
          <textarea
            className="params-editor__textarea"
            value={values.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={2}
            placeholder="Notas opcionales..."
          />
        </div>

        <Button variant="primary" size="lg" fullWidth loading={saving} onClick={handleSave}>
          <Save size={16} />
          Guardar
        </Button>
      </div>
    </div>
  )
}

/* --- Number Field --- */

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

function NumberField({ label, value, min, max, step = 1, onChange }: NumberFieldProps) {
  function decrement() {
    const next = Math.max(min, +(value - step).toFixed(1))
    onChange(next)
  }

  function increment() {
    const next = Math.min(max, +(value + step).toFixed(1))
    onChange(next)
  }

  return (
    <div className="number-field">
      <span className="number-field__label">{label}</span>
      <div className="number-field__controls">
        <button className="number-field__btn" type="button" onClick={decrement} aria-label={`Disminuir ${label}`}>
          -
        </button>
        <span className="number-field__value">{value}</span>
        <button className="number-field__btn" type="button" onClick={increment} aria-label={`Aumentar ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}
