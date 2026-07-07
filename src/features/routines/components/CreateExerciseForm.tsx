import { useRef, useState } from 'react'
import { X, Upload, Check } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { showToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import { createCustomExercise } from '../../../services/exercises.service'
import { uploadExerciseImage } from '../../../services/media.service'
import { MUSCLE_GROUP_OPTIONS } from '../../../utils/muscleGroupLabels'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import './CreateExerciseForm.css'

const MUSCLE_GROUPS: readonly string[] = MUSCLE_GROUP_OPTIONS

type CreateExerciseFormProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (exercise: ExerciseCatalogRow) => void
}

export function CreateExerciseForm({ isOpen, onClose, onCreated }: CreateExerciseFormProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setName('')
    setMuscleGroup('')
    setEquipment('')
    setInstructions('')
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !name.trim() || !muscleGroup) return

    setSaving(true)

    let imageUrl: string | undefined

    // 1. Subir imagen si existe
    if (imageFile) {
      const tempId = `temp-${Date.now()}`
      const { url, error: uploadErr } = await uploadExerciseImage(userId, tempId, imageFile)
      if (uploadErr) {
        showToast('Error al subir imagen', 'error')
        setSaving(false)
        return
      }
      imageUrl = url ?? undefined
    }

    // 2. Crear ejercicio en BD
    const { data, error } = await createCustomExercise({
      userId,
      name,
      muscleGroup,
      equipment,
      instructions,
      imageUrl,
    })

    if (error || !data) {
      showToast('Error al crear ejercicio', 'error')
      setSaving(false)
      return
    }

    showToast(`"${name}" creado correctamente`, 'success')
    onCreated(data)
    resetForm()
    onClose()
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="cef-overlay" onClick={onClose}>
      <div className="cef" onClick={(e) => e.stopPropagation()}>
        <div className="cef__header">
          <h3 className="cef__title">Nuevo ejercicio</h3>
          <IconButton icon={X} ariaLabel="Cerrar" size="sm" onClick={onClose} />
        </div>

        <form className="cef__form" onSubmit={handleSubmit} noValidate>

          {/* Imagen */}
          <button
            type="button"
            className="cef__image-btn"
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Vista previa" className="cef__image-preview" />
            ) : (
              <div className="cef__image-placeholder">
                <Upload size={24} />
                <span>Subir imagen / GIF</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="cef__file-input"
            onChange={handleFileSelect}
          />

          {/* Nombre */}
          <div className="cef__field">
            <label className="cef__label" htmlFor="ex-name">Nombre *</label>
            <input
              id="ex-name"
              className="cef__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Press banca con mancuernas"
              required
              autoFocus
            />
          </div>

          {/* Grupo muscular */}
          <div className="cef__field">
            <label className="cef__label" htmlFor="ex-muscle">Grupo muscular *</label>
            <select
              id="ex-muscle"
              className="cef__select"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>

          {/* Equipo */}
          <div className="cef__field">
            <label className="cef__label" htmlFor="ex-equip">Equipo (opcional)</label>
            <input
              id="ex-equip"
              className="cef__input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ej: Mancuernas, Barra, Máquina..."
            />
          </div>

          {/* Instrucciones */}
          <div className="cef__field">
            <label className="cef__label" htmlFor="ex-inst">Instrucciones (opcional)</label>
            <textarea
              id="ex-inst"
              className="cef__textarea"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe la ejecución del ejercicio..."
              rows={3}
            />
          </div>

          <div className="cef__actions">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!name.trim() || !muscleGroup || saving}
            >
              {saving ? <HamsterLoader size={20} /> : <Check size={14} />}
              {saving ? 'Guardando...' : 'Crear ejercicio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
