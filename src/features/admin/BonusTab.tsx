/* ============================================================
   BonusTab.tsx — Gestion de ejercicios bonus
   FASE 06 — GYM-YJMG
   Super-admin: crear/editar/eliminar.
   Admin normal: solo crear nuevos.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Dumbbell } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { showToast } from '../../components/ui/Toast'
import { AdminExerciseEditor } from '../settings/components/AdminExerciseEditor'
import type { ExerciseCatalogRow } from '../../types/exercise'
import './BonusTab.css'

type Props = { canEdit: boolean }

export function BonusTab({ canEdit }: Props) {
  const [exercises, setExercises] = useState<ExerciseCatalogRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState<ExerciseCatalogRow | null | 'new'>(null)

  const loadBonus = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exercises_catalog')
      .select('*')
      .eq('muscle_group', 'Bonificacion')
      .order('name', { ascending: true })

    if (error) showToast('Error al cargar ejercicios', 'error')
    else setExercises((data ?? []) as ExerciseCatalogRow[])
    setLoading(false)
  }, [])

  useEffect(() => { loadBonus() }, [loadBonus])

  return (
    <div className="bonus-tab">
      {/* Header de sección */}
      <div className="bonus-tab__header">
        <span className="bonus-tab__count">{exercises.length} ejercicios</span>
        <button
          className="bonus-tab__add-btn"
          onClick={() => setEditing('new')}
          aria-label="Agregar ejercicio bonus"
        >
          <Plus size={14} />
          Nuevo
        </button>
      </div>

      {/* Lista */}
      {loading && (
        <div className="bonus-tab__loading">
          <div className="bonus-tab__spinner" />
          <span>Cargando...</span>
        </div>
      )}

      {!loading && exercises.length === 0 && (
        <p className="bonus-tab__empty">Sin ejercicios bonus. Agrega el primero con +.</p>
      )}

      <div className="bonus-tab__list">
        {!loading && exercises.map((ex) => (
          <div key={ex.id} className="bonus-tab__item">
            <div className="bonus-tab__thumb">
              {ex.image_url
                ? <img src={ex.image_url} alt={ex.name} className="bonus-tab__thumb-img" loading="lazy" />
                : <Dumbbell size={15} />
              }
            </div>
            <div className="bonus-tab__info">
              <span className="bonus-tab__name">{ex.name}</span>
              <span className="bonus-tab__meta">{ex.equipment ?? 'Sin equipamiento'}</span>
            </div>
            {canEdit && (
              <button
                className="bonus-tab__edit-btn"
                onClick={() => setEditing(ex)}
                aria-label={`Editar ${ex.name}`}
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Editor */}
      {editing !== null && (
        <AdminExerciseEditor
          exercise={editing === 'new' ? undefined : editing}
          canDelete={canEdit}
          onClose={() => setEditing(null)}
          onSaved={() => { loadBonus(); setEditing(null) }}
        />
      )}
    </div>
  )
}
