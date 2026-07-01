/* ============================================================
   ExerciseVideoModal.tsx — Video de referencia del ejercicio
   A diferencia de HelpVideoModal (solo admin), CUALQUIER usuario
   edita su propio link — es privado, no lo ve nadie más.
   Soporta YouTube, TikTok e Instagram. Si el link no se puede
   embeber (formato corto/no soportado) cae a un botón "Ver en X".
   ============================================================ */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Check, Trash2, ExternalLink, Clapperboard } from 'lucide-react'
import { HamsterLoader } from '../HamsterLoader'
import { ConfirmDialog } from '../ConfirmDialog'
import { useExerciseVideo } from '../../../hooks/useExerciseVideo'
import { getVideoEmbedUrl, getVideoDirectUrl, detectVideoPlatform, getPlatformLabel } from '../../../utils/videoEmbed'
import './ExerciseVideoModal.css'

type ExerciseVideoModalProps = {
  exerciseId: string
  exerciseName: string
  onClose: () => void
}

export function ExerciseVideoModal({ exerciseId, exerciseName, onClose }: ExerciseVideoModalProps) {
  const { videoUrl, platform, loading, saving, save, remove } = useExerciseVideo(exerciseId)
  const [editing, setEditing] = useState(false)
  const [draftUrl, setDraftUrl] = useState('')
  const [iframeError, setIframeError] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const showForm = editing || (!loading && !videoUrl)
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null
  const showEmbed = videoUrl && embedUrl && !iframeError

  async function handleSave() {
    if (!draftUrl.trim()) return
    const ok = await save(draftUrl.trim())
    if (ok) {
      setEditing(false)
      setIframeError(false)
    }
  }

  async function handleDelete() {
    setConfirmingDelete(false)
    await remove()
  }

  const modalContent = (
    <div className="ex-video-overlay" onClick={onClose}>
      <div className="ex-video-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ex-video-modal__header">
          <h3 className="ex-video-modal__title">{exerciseName}</h3>
          <button className="ex-video-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="ex-video">
          {loading ? (
            <div className="ex-video__loading">
              <HamsterLoader size={64} />
            </div>
          ) : showForm ? (
            <div className="ex-video__form">
              <p className="ex-video__form-hint">
                Pega un link de YouTube, TikTok o Instagram con cómo hacer este ejercicio.
              </p>
              <div className="ex-video__form-row">
                <input
                  className="ex-video__input"
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                  placeholder="https://..."
                  autoFocus
                />
                <button className="ex-video__save-btn" onClick={handleSave} disabled={saving || !draftUrl.trim()}>
                  {saving ? <HamsterLoader size={18} /> : <Check size={16} />}
                </button>
              </div>
              {videoUrl && (
                <button className="ex-video__cancel-btn" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              )}
            </div>
          ) : (
            <>
              {showEmbed ? (
                <div className="ex-video__frame-wrap">
                  <iframe
                    className="ex-video__iframe"
                    src={embedUrl}
                    title={exerciseName}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={() => setIframeError(true)}
                  />
                </div>
              ) : (
                <div className="ex-video__fallback">
                  <Clapperboard size={28} />
                  <p>No se pudo mostrar la vista previa aquí.</p>
                  <a
                    className="ex-video__external-btn"
                    href={getVideoDirectUrl(videoUrl ?? '')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Ver en {getPlatformLabel(platform ?? detectVideoPlatform(videoUrl ?? ''))}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              <div className="ex-video__actions">
                <button className="ex-video__action-btn" onClick={() => { setDraftUrl(videoUrl ?? ''); setEditing(true) }}>
                  <Edit2 size={14} /> Cambiar link
                </button>
                <button className="ex-video__action-btn ex-video__action-btn--danger" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmingDelete}
        title="Eliminar video"
        message="¿Seguro que deseas quitar tu video de referencia para este ejercicio?"
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )

  return createPortal(modalContent, document.body)
}
