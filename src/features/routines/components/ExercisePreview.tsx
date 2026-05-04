import { useState } from 'react'
import { Dumbbell, Plus, X, Image as ImageIcon, Info, Wrench } from 'lucide-react'
import { IconButton } from '../../../components/ui/IconButton'
import { ExerciseMediaUpload } from './ExerciseMediaUpload'
import { AdminExerciseEditor } from '../../settings/components/AdminExerciseEditor'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import { toSpanishMuscle } from '../../../utils/muscleGroupLabels'
import { useUserRole } from '../../../utils/useUserRole'
import './ExercisePreview.css'

type ExercisePreviewProps = {
  exercise: ExerciseCatalogRow
  onAdd?: () => void
  onClose: () => void
  onSaved?: () => void
}

export function ExercisePreview({ exercise, onAdd, onClose, onSaved }: ExercisePreviewProps) {
  const { role } = useUserRole()
  const isSuperAdmin = role === 'super_admin'
  
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    resolveMediaUrl(exercise),
  )
  const [imgFailed, setImgFailed] = useState(false)
  const [expandedInstructions, setExpandedInstructions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  function handleUpload(url: string) {
    setCurrentImageUrl(url)
    setImgFailed(false)
  }

  const MAX_CHARS = 120
  const instructions = exercise.instructions || ''
  const isLong = instructions.length > MAX_CHARS
  const displayInstructions = expandedInstructions || !isLong
    ? instructions
    : instructions.slice(0, MAX_CHARS).trim() + '...'

  return (
    <>
      <div className="preview-overlay" onClick={onClose}>
        <div className="preview" onClick={(e) => e.stopPropagation()}>
          <div className="preview__header">
            <h3 className="preview__title">{exercise.name}</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {isSuperAdmin && (
                <IconButton icon={Wrench} ariaLabel="Editar" size="sm" onClick={() => setIsEditing(true)} />
              )}
              <IconButton icon={X} ariaLabel="Cerrar" size="sm" onClick={onClose} />
            </div>
          </div>

        <div className="preview__media">
          {currentImageUrl && !imgFailed ? (
            <img
              key={currentImageUrl}
              src={currentImageUrl}
              alt={exercise.name}
              className="preview__image"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="preview__no-media">
              <ImageIcon size={32} />
              <span>{imgFailed ? 'No se pudo cargar la imagen' : 'Sin imagen disponible'}</span>
            </div>
          )}
        </div>

        <ExerciseMediaUpload
        exerciseId={exercise.id}
        currentImageUrl={currentImageUrl}
        onUploaded={handleUpload}
      />

      <div className="preview__details">
        <DetailRow icon={Dumbbell} label="Grupo muscular" value={toSpanishMuscle(exercise.muscle_group)} />
        {exercise.equipment && (
          <DetailRow icon={Wrench} label="Equipo" value={exercise.equipment} />
        )}
      </div>

      {exercise.instructions && (
        <div className="preview__instructions">
          <div className="preview__instructions-header">
            <Info size={14} />
            <span>Instrucciones</span>
          </div>
          <p className="preview__instructions-text">
            {displayInstructions}
            {isLong && (
              <button
                type="button"
                className="preview__instructions-more"
                onClick={() => setExpandedInstructions(!expandedInstructions)}
              >
                {expandedInstructions ? ' (ver menos)' : ' (leer más...)'}
              </button>
            )}
          </p>
        </div>
      )}

      {onAdd && (
        <button
          type="button"
          className="preview-action-btn preview-action-btn--primary"
          onClick={onAdd}
        >
          <div className="preview-action-btn__icon-wrapper">
            <Plus size={24} className="preview-action-btn__icon" strokeWidth={2.5} />
          </div>
          <div className="preview-action-btn__text">
            <span className="preview-action-btn__title">Agregar a rutina</span>
            <span className="preview-action-btn__sub">Añadir ejercicio</span>
          </div>
        </button>
      )}
      </div>
      </div>
      {isEditing && (
        <AdminExerciseEditor
          exercise={exercise}
          canDelete={isSuperAdmin}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            if (onSaved) onSaved()
          }}
        />
      )}
    </>
  )
}

/* --- Detail Row --- */

type DetailRowProps = {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: string
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="preview__detail-row">
      <div className="preview__detail-icon">
        <Icon size={14} />
      </div>
      <span className="preview__detail-label">{label}</span>
      <span className="preview__detail-value">{value}</span>
    </div>
  )
}

function resolveMediaUrl(exercise: ExerciseCatalogRow): string | null {
  if (exercise.image_url) return exercise.image_url
  if (exercise.media_thumbnail_url) return exercise.media_thumbnail_url
  if (exercise.video_url) return exercise.video_url
  return null
}
