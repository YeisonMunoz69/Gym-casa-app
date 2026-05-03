import { useRef, useState } from 'react'
import { Trash2, Dumbbell, Settings2, Upload, GripVertical } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '../../../components/ui/Card'
import { IconButton } from '../../../components/ui/IconButton'
import { useAuthStore } from '../../../stores/authStore'
import { uploadExerciseImage, saveExerciseImageUrl } from '../../../services/media.service'
import type { RoutineExerciseWithDetails } from '../../../types/routine'
import { toSpanishMuscle } from '../../../utils/muscleGroupLabels'
import './ExerciseItem.css'

type ExerciseItemProps = {
  row: RoutineExerciseWithDetails
  index: number
  onRemove: () => void
  onEdit: () => void
}

export function ExerciseItem({ row, index, onRemove, onEdit }: ExerciseItemProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const isTimeBased = row.is_time_based
  const params = isTimeBased
    ? `${row.target_sets}x ${row.target_time_seconds}s`
    : `${row.target_sets}x${row.rep_min}-${row.rep_max} · RIR ${row.rir_target}`
  const [imageUrl, setImageUrl] = useState<string | null>(row.exercise.image_url)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /* --- Sortable (dnd-kit) --- */
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    const { url, error } = await uploadExerciseImage(userId, row.exercise.id, file)
    if (url && !error) {
      await saveExerciseImageUrl(row.exercise.id, url)
      setImageUrl(url)
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div ref={setNodeRef} style={style} className="exercise-item-wrapper">
      <Card variant="default" padding="sm" className="exercise-item">
        {/* Handle de arrastre */}
        <button
          className="exercise-item__handle"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar para reordenar"
          type="button"
        >
          <GripVertical size={16} />
        </button>

        <div className="exercise-item__index">{index + 1}</div>

        {/* Thumbnail clickable para subir imagen */}
        <button
          type="button"
          className="exercise-item__thumb"
          onClick={() => inputRef.current?.click()}
          aria-label={`Subir imagen para ${row.exercise.name}`}
          title={imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
        >
          {uploading ? (
            <HamsterLoader size={36} />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={row.exercise.name}
              className="exercise-item__thumb-img"
              loading="lazy"
            />
          ) : (
            <div className="exercise-item__thumb-placeholder">
              <Dumbbell size={14} />
              <Upload size={10} className="exercise-item__upload-hint" />
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="exercise-item__file-input"
          onChange={handleFile}
          aria-hidden="true"
        />

        <div className="exercise-item__info">
          <span className="exercise-item__name">{row.exercise.name}</span>
          <span className="exercise-item__meta">
            {toSpanishMuscle(row.exercise.muscle_group)} · {params}
          </span>
        </div>

        <IconButton
          icon={Settings2}
          size="sm"
          variant="ghost"
          ariaLabel={`Editar ${row.exercise.name}`}
          onClick={onEdit}
        />
        <IconButton
          icon={Trash2}
          size="sm"
          variant="ghost"
          ariaLabel={`Eliminar ${row.exercise.name}`}
          onClick={onRemove}
        />
      </Card>
    </div>
  )
}
