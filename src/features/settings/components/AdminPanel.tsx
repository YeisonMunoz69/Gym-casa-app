/* ============================================================
   AdminPanel.tsx — Panel de administracion para super-admin
   FASE 06 — GYM-YJMG
   Visible solo cuando useIsAdmin() = true.
   Lista ejercicios Bonificacion con edicion y creacion.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Shield, Dumbbell } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import { showToast } from '../../../components/ui/Toast'
import { AdminExerciseEditor } from './AdminExerciseEditor'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import './AdminPanel.css'

export function AdminPanel() {
  const [exercises, setExercises] = useState<ExerciseCatalogRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState<ExerciseCatalogRow | null | 'new'>(null)

  const loadBonusExercises = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exercises_catalog')
      .select('*')
      .eq('muscle_group', 'Bonificacion')
      .order('name', { ascending: true })

    if (error) {
      showToast('Error al cargar ejercicios bonus', 'error')
    } else {
      setExercises((data ?? []) as ExerciseCatalogRow[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadBonusExercises() }, [loadBonusExercises])

  return (
    <section className="admin-panel settings-section">
      {/* Header */}
      <div className="admin-panel__header">
        <div className="admin-panel__title-row">
          <Shield size={14} className="admin-panel__shield" />
          <span className="settings-section__label">Panel de Administrador</span>
        </div>
        <button
          className="admin-panel__add-btn"
          onClick={() => setEditing('new')}
          aria-label="Agregar ejercicio bonus"
        >
          <Plus size={14} />
          Nuevo bonus
        </button>
      </div>

      <p className="admin-panel__desc">
        Gestiona los ejercicios de bonificacion que pueden aparecer al final de cada sesion.
      </p>

      {/* Lista */}
      <div className="admin-panel__list">
        {loading && (
          <p className="admin-panel__loading">Cargando...</p>
        )}

        {!loading && exercises.length === 0 && (
          <p className="admin-panel__empty">No hay ejercicios bonus. Agrega el primero.</p>
        )}

        {!loading && exercises.map((ex) => (
          <div key={ex.id} className="admin-panel__item">
            <div className="admin-panel__item-thumb">
              {ex.image_url
                ? <img src={ex.image_url} alt={ex.name} className="admin-panel__item-img" loading="lazy" />
                : <Dumbbell size={14} />
              }
            </div>
            <div className="admin-panel__item-info">
              <span className="admin-panel__item-name">{ex.name}</span>
              <span className="admin-panel__item-meta">{ex.equipment ?? 'Sin equipamiento'}</span>
            </div>
            <button
              className="admin-panel__edit-btn"
              onClick={() => setEditing(ex)}
              aria-label={`Editar ${ex.name}`}
            >
              <Pencil size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor (crear o editar) */}
      {editing !== null && (
        <AdminExerciseEditor
          exercise={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={loadBonusExercises}
        />
      )}
    </section>
  )
}
