import React, { useState } from 'react'
import { User, Ruler, Weight, Target, Zap, Edit2, Check, X, Camera } from 'lucide-react'
import { useProfileStore } from '../../../stores/profileStore'
import { useAuthStore } from '../../../stores/authStore'
import { uploadAvatar } from '../../../services/profiles.service'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { ImageCropper } from '../../../components/ui/ImageCropper'
import { BodyMeasurementLog } from './BodyMeasurementLog'
import { HelpVideoButton } from '../../../components/ui/HelpVideo/HelpVideoButton'
import './ProfileScreen.css'

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Perder peso',
  gain_muscle: 'Ganar músculo',
  maintain: 'Mantener',
  strength: 'Fuerza máxima',
  endurance: 'Resistencia',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Hombre',
  female: 'Mujer',
  other: 'Otro',
}

export function ProfileScreen() {
  const userId = useAuthStore((s) => s.user?.id)
  const userEmail = useAuthStore((s) => s.user?.email)
  const { profile, saveProfile } = useProfileStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({
    full_name: profile?.full_name ?? '',
    height_cm: profile?.height_cm?.toString() ?? '',
    initial_weight_kg: profile?.initial_weight_kg?.toString() ?? '',
    goal: profile?.goal ?? '',
    experience_level: profile?.experience_level ?? '',
    gender: profile?.gender ?? '',
  })

  const [cropImage, setCropImage] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const initials = (profile?.full_name ?? userEmail ?? '?')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCrop(blob: Blob) {
    setCropImage(null)
    setUploadingAvatar(true)
    const { url, error } = await uploadAvatar(userId!, blob)
    setUploadingAvatar(false)
    if (error) {
      showToast('Error subiendo foto', 'error')
      return
    }
    // El profileStore no tiene una función para actualizar una propiedad local, 
    // pero podemos forzar el refetch si llamamos fetchProfile, o se autoactualiza si usamos la suscripción.
    // Usaremos saveProfile para forzar la sincronización, aunque ya se guardó en el service.
    await saveProfile(userId!, { avatar_url: url! })
    showToast('Foto actualizada', 'success')
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    const ok = await saveProfile(userId, {
      full_name: draft.full_name || null,
      height_cm: draft.height_cm ? parseFloat(draft.height_cm) : null,
      initial_weight_kg: draft.initial_weight_kg ? parseFloat(draft.initial_weight_kg) : null,
      goal: draft.goal as any || null,
      experience_level: draft.experience_level as any || null,
      gender: draft.gender as any || null,
    })
    setSaving(false)
    if (ok) { showToast('Perfil actualizado', 'success'); setEditing(false) }
    else showToast('Error al guardar', 'error')
  }

  function handleCancel() {
    setDraft({
      full_name: profile?.full_name ?? '',
      height_cm: profile?.height_cm?.toString() ?? '',
      initial_weight_kg: profile?.initial_weight_kg?.toString() ?? '',
      goal: profile?.goal ?? '',
      experience_level: profile?.experience_level ?? '',
      gender: profile?.gender ?? '',
    })
    setEditing(false)
  }

  return (
    <div className="profile-screen">
      {cropImage && (
        <ImageCropper
          imageUrl={cropImage}
          onCrop={handleCrop}
          onCancel={() => setCropImage(null)}
        />
      )}

      {/* Avatar + nombre */}
      <div className="profile-screen__hero">
        <div className="profile-screen__avatar-wrapper">
          <div className="profile-screen__avatar-ring"></div>
          <div
            className={`profile-screen__avatar ${uploadingAvatar ? 'profile-screen__avatar--uploading' : ''} profile-screen__avatar--editing`}
            onClick={() => { if (!uploadingAvatar) fileInputRef.current?.click() }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="profile-screen__avatar-img" />
            ) : (
              <span className="profile-screen__avatar-initials">{initials}</span>
            )}
            <div className="profile-screen__avatar-overlay">
              <Camera size={24} />
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
          </div>
        </div>
        {editing ? (
          <input className="profile-screen__name-input" value={draft.full_name} placeholder="Tu nombre" onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))} autoFocus />
        ) : (
          <h1 className="profile-screen__name">{profile?.full_name ?? 'Sin nombre'}</h1>
        )}
        <p className="profile-screen__email">{userEmail}</p>
        <div className="profile-screen__edit-row">
          {editing ? (
            <>
              <Button variant="primary" size="sm" loading={saving} cyber onClick={handleSave}><Check size={14} /> Guardar</Button>
              <Button variant="ghost" size="sm" cyber onClick={handleCancel}><X size={14} /> Cancelar</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" cyber onClick={() => setEditing(true)}><Edit2 size={14} /> Editar perfil</Button>
              <HelpVideoButton sectionKey="settings_profile" title="Tutorial: Ajustes y Perfil" />
            </>
          )}
        </div>
      </div>

      {/* Métricas físicas */}
      <section className="profile-screen__section">
        <h2 className="profile-screen__section-title">Métricas físicas</h2>
        <div className="profile-screen__metrics">
          <div onClick={() => setEditing(true)}>
            <ProfileMetric Icon={Ruler} label="Altura" value={profile?.height_cm ? `${profile.height_cm} cm` : '—'} editing={editing} inputValue={draft.height_cm} onEdit={(v) => setDraft((d) => ({ ...d, height_cm: v }))} unit="cm" type="number" />
          </div>
          <div onClick={() => setEditing(true)}>
            <ProfileMetric Icon={Weight} label="Peso base" value={profile?.initial_weight_kg ? `${profile.initial_weight_kg} kg` : '—'} editing={editing} inputValue={draft.initial_weight_kg} onEdit={(v) => setDraft((d) => ({ ...d, initial_weight_kg: v }))} unit="kg" type="number" />
          </div>
          <div onClick={() => setEditing(true)}>
            <ProfileMetric Icon={Target} label="Objetivo" value={profile?.goal ? GOAL_LABELS[profile.goal] : '—'} editing={editing} inputValue={draft.goal} onEdit={(v) => setDraft((d) => ({ ...d, goal: v }))} type="select" options={GOAL_LABELS} />
          </div>
          <div onClick={() => setEditing(true)}>
            <ProfileMetric Icon={Zap} label="Nivel" value={profile?.experience_level ? LEVEL_LABELS[profile.experience_level] : '—'} editing={editing} inputValue={draft.experience_level} onEdit={(v) => setDraft((d) => ({ ...d, experience_level: v }))} type="select" options={LEVEL_LABELS} />
          </div>
          <div onClick={() => setEditing(true)}>
            <ProfileMetric Icon={User} label="Género" value={profile?.gender ? GENDER_LABELS[profile.gender] : '—'} editing={editing} inputValue={draft.gender} onEdit={(v) => setDraft((d) => ({ ...d, gender: v }))} type="select" options={GENDER_LABELS} />
          </div>
        </div>
      </section>

      {/* Historial de peso */}
      <BodyMeasurementLog />
    </div>
  )
}

type MetricProps = {
  Icon: React.ElementType
  label: string
  value: string
  editing?: boolean
  inputValue?: string
  onEdit?: (v: string) => void
  unit?: string
  type?: 'number' | 'select'
  options?: Record<string, string>
}

function ProfileMetric({ Icon, label, value, editing, inputValue, onEdit, unit, type = 'number', options }: MetricProps) {
  return (
    <div className="profile-metric">
      <div className="profile-metric__icon"><Icon size={16} /></div>
      <span className="profile-metric__label">{label}</span>
      {editing && onEdit ? (
        <div className="profile-metric__input-wrap">
          {type === 'select' && options ? (
            <select className="profile-metric__select" value={inputValue} onChange={(e) => onEdit(e.target.value)}>
              <option value="" disabled>Seleccionar</option>
              {Object.entries(options).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          ) : (
            <>
              <input type="number" className="profile-metric__input" value={inputValue} onChange={(e) => onEdit(e.target.value)} />
              {unit && <span className="profile-metric__unit">{unit}</span>}
            </>
          )}
        </div>
      ) : (
        <span className="profile-metric__value">{value}</span>
      )}
    </div>
  )
}
