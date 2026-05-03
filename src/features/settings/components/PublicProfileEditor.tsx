/* ============================================================
   PublicProfileEditor.tsx — Editor de nombre e identificador del hogar
   FASE 06 — GYM-YJMG
   Permite al usuario editar display_name y household_label
   (tabla profiles, no user_profiles).
   Limite: 100 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect } from 'react'
import { Home, User, Check, Loader } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { updatePublicProfile } from '../../../services/profiles.service'
import { showToast } from '../../../components/ui/Toast'
import { supabase } from '../../../services/supabase'
import './PublicProfileEditor.css'

type PublicProfile = { display_name: string | null; household_label: string }

export function PublicProfileEditor() {
  const userId = useAuthStore((s) => s.user?.id)
  const [displayName,     setDisplayName]     = useState('')
  const [householdLabel,  setHouseholdLabel]  = useState('Casa')
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [dirty,           setDirty]           = useState(false)

  // Carga inicial del perfil publico
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name, household_label')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as PublicProfile | null
        setDisplayName(p?.display_name ?? '')
        setHouseholdLabel(p?.household_label ?? 'Casa')
        setLoading(false)
      })
  }, [userId])

  function handleDisplayNameChange(val: string) {
    setDisplayName(val)
    setDirty(true)
  }

  function handleHouseholdChange(val: string) {
    setHouseholdLabel(val)
    setDirty(true)
  }

  async function handleSave() {
    if (!userId || !dirty) return
    setSaving(true)
    try {
      const { error } = await updatePublicProfile(userId, {
        display_name: displayName.trim() || null,
        household_label: householdLabel.trim() || 'Casa',
      })
      if (error) {
        showToast('Error al guardar', 'error')
      } else {
        showToast('Perfil actualizado', 'success')
        setDirty(false)
      }
    } catch (err) {
      showToast('Error inesperado al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="pub-profile-editor">
      <p className="pub-profile-editor__section-label">Perfil visible</p>

      <div className="pub-profile-editor__field">
        <label className="pub-profile-editor__label" htmlFor="display-name-input">
          <User size={13} /> Nombre para mostrar
        </label>
        <input
          id="display-name-input"
          className="pub-profile-editor__input"
          value={displayName}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          placeholder="Como te llamas..."
          maxLength={40}
        />
      </div>

      <div className="pub-profile-editor__field">
        <label className="pub-profile-editor__label" htmlFor="household-input">
          <Home size={13} /> Nombre del hogar
        </label>
        <input
          id="household-input"
          className="pub-profile-editor__input"
          value={householdLabel}
          onChange={(e) => handleHouseholdChange(e.target.value)}
          placeholder='Ej: "Casa García", "Familia..."'
          maxLength={40}
        />
        <p className="pub-profile-editor__hint">
          Agrupa tu cuenta. Por defecto es "Casa".
        </p>
      </div>

      {dirty && (
        <button
          className="pub-profile-editor__save-btn"
          onClick={handleSave}
          disabled={saving}
          aria-label="Guardar cambios de perfil visible"
        >
          {saving ? <Loader size={14} className="pub-profile-editor__spinner" /> : <Check size={14} />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      )}
    </div>
  )
}
