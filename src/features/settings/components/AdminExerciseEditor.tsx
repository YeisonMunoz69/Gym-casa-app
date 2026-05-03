/* ============================================================
   AdminExerciseEditor.tsx — Editor de ejercicio para super-admin
   FASE 06 — GYM-YJMG
   Crea o edita un ejercicio Bonificacion. Incluye imagen/GIF.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useRef } from 'react'
import { X, ImagePlus, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import {
  createBonusExercise,
  updateExercise,
  adminDeleteExercise,
} from '../../../services/exercises.service'
import { uploadExerciseImage, saveExerciseImageUrl } from '../../../services/media.service'
import { showToast } from '../../../components/ui/Toast'
import { Button } from '../../../components/ui/Button'
import { MUSCLE_GROUP_OPTIONS } from '../../../utils/muscleGroupLabels'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import './AdminExerciseEditor.css'

type Props = {
  exercise?:  ExerciseCatalogRow   // undefined = modo creación
  canDelete?: boolean              // solo super_admin
  onClose:    () => void
  onSaved:    () => void
}

export function AdminExerciseEditor({ exercise, canDelete = false, onClose, onSaved }: Props) {
  const userId = useAuthStore((s: any) => s.user?.id)
  const isEdit = !!exercise

  const [name,         setName]         = useState(exercise?.name ?? '')
  const [muscleGroup,  setMuscleGroup]  = useState(exercise?.muscle_group ?? 'Bonificacion')
  const [equipment,    setEquipment]    = useState(exercise?.equipment ?? '')
  const [instructions, setInstructions] = useState(exercise?.instructions ?? '')
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(exercise?.image_url ?? null)
  const [saving,       setSaving]       = useState(false)
  const [confirming,   setConfirming]   = useState(false)
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

    const input = {
      name: name.trim(), muscleGroup,
      equipment: equipment.trim() || undefined,
      instructions: instructions.trim() || undefined,
    }

    if (isEdit) {
      // Subir imagen si cambió
      let imageUrl: string | undefined
      if (imageFile) {
        const { url } = await uploadExerciseImage(userId, exercise!.id, imageFile)
        if (url) { imageUrl = url; await saveExerciseImageUrl(exercise!.id, url) }
      }
      const { error } = await updateExercise(exercise!.id, { ...input, imageUrl })
      if (error) { showToast('Error al guardar', 'error'); setSaving(false); return }
      showToast('Ejercicio actualizado', 'success')
    } else {
      const { data: created, error } = await createBonusExercise(input)
      if (error || !created) { showToast('Error al crear', 'error'); setSaving(false); return }
      if (imageFile) {
        const { url } = await uploadExerciseImage(userId, created.id, imageFile)
        if (url) await saveExerciseImageUrl(created.id, url)
      }
      showToast('Ejercicio creado', 'success')
    }

    onSaved(); onClose(); setSaving(false)
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setSaving(true)
    const { error } = await adminDeleteExercise(exercise!.id)
    if (error) { showToast('Error al eliminar', 'error'); setSaving(false); return }
    showToast('Ejercicio eliminado', 'success')
    onSaved(); onClose()
  }

  return (
    <div className="adm-editor-overlay" role="dialog" aria-modal="true">
      <div className="adm-editor">
        <div className="adm-editor__header">
          <div className="adm-editor__title-row">
            <div className="adm-editor__badge">ADMIN</div>
            <h2 className="adm-editor__title">{isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio bonus'}</h2>
          </div>
          <button className="adm-editor__close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <form className="adm-editor__form" onSubmit={handleSubmit}>
          <div className="adm-editor__image-picker" onClick={() => fileRef.current?.click()}>
            {imagePreview
              ? <img src={imagePreview} alt="Preview" className="adm-editor__image-preview" />
              : <div className="adm-editor__image-ph"><ImagePlus size={22} /><span>Imagen o GIF</span></div>
            }
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          <label className="adm-editor__field">
            <span className="adm-editor__label">Nombre *</span>
            <input className="adm-editor__input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del ejercicio" required maxLength={80} />
          </label>

          <label className="adm-editor__field">
            <span className="adm-editor__label">Grupo muscular *</span>
            <select className="adm-editor__input adm-editor__select" value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)} required>
              <option value="Bonificacion">Bonificacion</option>
              {MUSCLE_GROUP_OPTIONS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
            </select>
          </label>

          <label className="adm-editor__field">
            <span className="adm-editor__label">Equipamiento</span>
            <input className="adm-editor__input" value={equipment} onChange={(e) => setEquipment(e.target.value)}
              placeholder="Sin equipamiento, Mancuernas..." maxLength={60} />
          </label>

          <label className="adm-editor__field">
            <span className="adm-editor__label">Instrucciones</span>
            <textarea className="adm-editor__input adm-editor__textarea" value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Como se realiza el ejercicio..." rows={3} maxLength={400} />
          </label>

          <div className="adm-editor__actions">
            {isEdit && canDelete && (
              <button type="button" className={`adm-editor__delete-btn ${confirming ? 'adm-editor__delete-btn--confirm' : ''}`}
                onClick={handleDelete} disabled={saving}>
                <Trash2 size={14} />
                {confirming ? 'Confirmar eliminacion' : 'Eliminar'}
              </button>
            )}
            <div className="adm-editor__actions-right">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
              <Button variant="primary" size="sm" disabled={!name.trim() || saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear ejercicio'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
