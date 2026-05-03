import { useRef, useState } from 'react'
import { Upload, Check, AlertTriangle } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { useAuthStore } from '../../../stores/authStore'
import { uploadExerciseImage, saveExerciseImageUrl } from '../../../services/media.service'
import './ExerciseMediaUpload.css'

type UploadStatus = 'idle' | 'loading' | 'success' | 'error'

type ExerciseMediaUploadProps = {
  exerciseId: string
  currentImageUrl: string | null
  onUploaded: (url: string) => void
}

export function ExerciseMediaUpload({
  exerciseId,
  currentImageUrl,
  onUploaded,
}: ExerciseMediaUploadProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setStatus('loading')
    setErrorMessage('')

    const { url, error: uploadError } = await uploadExerciseImage(userId, exerciseId, file)

    if (uploadError || !url) {
      setStatus('error')
      setErrorMessage(uploadError ?? 'Error al subir imagen')
      return
    }

    const { error: saveError } = await saveExerciseImageUrl(exerciseId, url)

    if (saveError) {
      setStatus('error')
      setErrorMessage(saveError)
      return
    }

    setStatus('success')
    onUploaded(url)

    // Reset status after 2s
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="media-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="media-upload__input"
        onChange={handleFile}
        aria-label="Subir imagen del ejercicio"
      />

      <button
        type="button"
        className="media-upload__btn"
        data-status={status}
        onClick={() => inputRef.current?.click()}
        disabled={status === 'loading'}
      >
        {status === 'loading' && <HamsterLoader size={20} />}
        {status === 'success' && <Check size={14} />}
        {status === 'error' && <AlertTriangle size={14} />}
        {status === 'idle' && <Upload size={14} />}

        <span>
          {status === 'loading' && 'Subiendo...'}
          {status === 'success' && 'Imagen guardada'}
          {status === 'error' && 'Reintentar'}
          {status === 'idle' && (currentImageUrl ? 'Cambiar imagen' : 'Subir imagen')}
        </span>
      </button>

      {status === 'error' && (
        <p className="media-upload__error">{errorMessage}</p>
      )}
    </div>
  )
}
