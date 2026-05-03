/* ============================================================
   AddExerciseDialog.tsx — Formulario para agregar ejercicio propio
   FASE 06 — GYM-YJMG
   v2: Incluye upload de imagen al bucket exercise-media.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useRef } from 'react'
import { X, Dumbbell, ImagePlus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { createCustomExercise } from '../../services/exercises.service'
import { uploadExerciseImage, saveExerciseImageUrl } from '../../services/media.service'
import { showToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { MUSCLE_GROUP_OPTIONS } from '../../utils/muscleGroupLabels'
import './AddExerciseDialog.css'

type Props = { onClose: () => void; onCreated: () => void }

export function AddExerciseDialog({ onClose, onCreated }: Props) {
  const userId = useAuthStore((s: any) => s.user?.id)

  const [name,         setName]         = useState('')
  const [muscleGroup,  setMuscleGroup]  = useState('')
  const [equipment,    setEquipment]    = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !name.trim() || !muscleGroup) return
    setSaving(true)

    // 1. Crear el ejercicio en la BD
    const { data: created, error } = await createCustomExercise({
      userId,
      name:         name.trim(),
      muscleGroup,
      equipment:    equipment.trim() || undefined,
      instructions: instructions.trim() || undefined,
    })

    if (error || !created) {
      showToast('Error al crear el ejercicio', 'error')
      setSaving(false)
      return
    }

    // 2. Subir imagen si se eligió una
    if (imageFile) {
      const { url, error: uploadErr } = await uploadExerciseImage(userId, created.id, imageFile)
      if (!uploadErr && url) {
        await saveExerciseImageUrl(created.id, url)
      }
    }

    showToast('Ejercicio creado correctamente', 'success')
    onCreated()
    onClose()
    setSaving(false)
  }

  return (
    <div className="add-ex-overlay" role="dialog" aria-modal="true">
      <div className="add-ex-dialog">
        <div className="add-ex-dialog__header">
          <div className="add-ex-dialog__title-row">
            <div className="add-ex-dialog__icon"><Dumbbell size={16} /></div>
            <h2 className="add-ex-dialog__title">Nuevo Ejercicio</h2>
          </div>
          <button className="add-ex-dialog__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form className="add-ex-dialog__form" onSubmit={handleSubmit}>
          {/* Imagen */}
          <div className="add-ex-image-picker" onClick={() => fileRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="add-ex-image-picker__preview" />
            ) : (
              <div className="add-ex-image-picker__placeholder">
                <ImagePlus size={22} />
                <span>Agregar imagen o GIF</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="Seleccionar imagen del ejercicio"
            />
          </div>

          <label className="add-ex-field">
            <span className="add-ex-field__label">Nombre *</span>
            <input id="ex-name" className="add-ex-field__input" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Press banca con barra" required maxLength={80} />
          </label>

          <label className="add-ex-field">
            <span className="add-ex-field__label">Grupo muscular *</span>
            <select id="ex-muscle" className="add-ex-field__input add-ex-field__select"
              value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} required>
              <option value="">Selecciona un grupo...</option>
              {MUSCLE_GROUP_OPTIONS.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </label>

          <label className="add-ex-field">
            <span className="add-ex-field__label">Equipamiento</span>
            <input id="ex-equipment" className="add-ex-field__input" value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ej: Barra, Mancuernas, Sin equipamiento" maxLength={60} />
          </label>

          <label className="add-ex-field">
            <span className="add-ex-field__label">Instrucciones</span>
            <textarea id="ex-instructions" className="add-ex-field__input add-ex-field__textarea"
              value={instructions} onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe como realizar el ejercicio..." rows={3} maxLength={300} />
          </label>

          <div className="add-ex-dialog__actions">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" size="sm" disabled={!name.trim() || !muscleGroup || saving}>
              {saving ? 'Guardando...' : 'Crear ejercicio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
