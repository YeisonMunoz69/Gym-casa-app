import { useState } from 'react'
import { Plus } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useRoutineDayExercises } from '../hooks/useRoutineDayExercises'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { showToast } from '../../../components/ui/Toast'
import { reorderDayExercises, addExerciseToMultipleDays } from '../../../services/routines.service'
import { AddExerciseSheet } from './AddExerciseSheet'
import { ExercisePreview } from './ExercisePreview'
import { ExerciseItem } from './ExerciseItem'
import { ExerciseParamsEditor } from './ExerciseParamsEditor'
import type { ParamValues } from './ExerciseParamsEditor'
import type { RoutineExerciseWithDetails, RoutineDayRow } from '../../../types/routine'
import { WEEKDAY_LABELS } from '../../../types/routine'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import './DayExerciseList.css'

type DayExerciseListProps = {
  dayId: string
  dayLabel: string
  routineDays?: RoutineDayRow[]
}

type PendingDelete = { id: string; name: string } | null

export function DayExerciseList({ dayId, dayLabel, routineDays }: DayExerciseListProps) {
  const { exercises, loading, addExercise, removeExercise, updateParams, refresh } =
    useRoutineDayExercises(dayId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<RoutineExerciseWithDetails | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [previewExercise, setPreviewExercise] = useState<ExerciseCatalogRow | null>(null)

  // Estado para la seleccion multi-dia
  const [multiDayAddEx, setMultiDayAddEx] = useState<ExerciseCatalogRow | null>(null)
  const [selectedDayIds, setSelectedDayIds] = useState<Set<string>>(new Set([dayId]))
  const [isAddingMulti, setIsAddingMulti] = useState(false)

  /* --- Sensores para drag & drop (mouse + touch + teclado) --- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = exercises.findIndex((e) => e.id === active.id)
    const newIndex = exercises.findIndex((e) => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Reorden optimista en UI
    const reordered = arrayMove(exercises, oldIndex, newIndex)

    // Persistir nuevos order_index en Supabase
    const updates = reordered.map((ex, i) => ({ id: ex.id, order_index: i }))
    const { error } = await reorderDayExercises(updates)

    if (error) {
      showToast('Error al reordenar ejercicios', 'error')
      await refresh()  // Revertir si falla
    } else {
      await refresh()  // Sincronizar con BD
    }
  }

  async function handleAddFromSheet(catalogExercise: ExerciseCatalogRow) {
    if (routineDays && routineDays.length > 1) {
      // Ocultar hoja y mostrar seleccion de dias
      setSheetOpen(false)
      if (previewExercise) setPreviewExercise(null)
      
      // Preseleccionar el dia actual
      setSelectedDayIds(new Set([dayId]))
      setMultiDayAddEx(catalogExercise)
      return
    }

    // Comportamiento normal (1 solo dia)
    const success = await addExercise(catalogExercise.id)
    if (success) {
      showToast(`${catalogExercise.name} agregado`, 'success')
      setSheetOpen(false)
      if (previewExercise) setPreviewExercise(null)
    } else {
      showToast('Error al agregar ejercicio', 'error')
    }
  }

  async function confirmMultiDayAdd() {
    if (!multiDayAddEx) return
    if (selectedDayIds.size === 0) {
      showToast('Selecciona al menos un día', 'error')
      return
    }

    setIsAddingMulti(true)
    const { error } = await addExerciseToMultipleDays(Array.from(selectedDayIds), multiDayAddEx.id)
    setIsAddingMulti(false)

    if (error) {
      showToast('Error al agregar a múltiples días', 'error')
    } else {
      showToast(`${multiDayAddEx.name} agregado a ${selectedDayIds.size} día(s)`, 'success')
      setMultiDayAddEx(null)
      await refresh()
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    const success = await removeExercise(pendingDelete.id)
    if (success) showToast(`${pendingDelete.name} eliminado`, 'success')
    else showToast('Error al eliminar ejercicio', 'error')
    setPendingDelete(null)
  }

  async function handleSaveParams(params: ParamValues) {
    if (!editingExercise) return
    const success = await updateParams(editingExercise.id, params)
    if (success) {
      showToast('Parametros actualizados', 'success')
      setEditingExercise(null)
    } else {
      showToast('Error al actualizar', 'error')
    }
  }

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <HamsterLoader size={120} />
        <span className="loading-fullscreen__label">Cargando ejercicios...</span>
      </div>
    )
  }

  return (
    <div className="day-exercises">
      <div className="day-exercises__header">
        <h3 className="day-exercises__title">Ejercicios — {dayLabel}</h3>
        <Button variant="primary" size="sm" cyber onClick={() => setSheetOpen(true)}>
          <Plus size={14} />
          Agregar
        </Button>
      </div>

      {exercises.length === 0 && (
        <p className="day-exercises__empty">Sin ejercicios en este dia</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={exercises.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="day-exercises__list">
            {exercises.map((row, index) => (
              <ExerciseItem
                key={row.id}
                row={row}
                index={index}
                onRemove={() => setPendingDelete({ id: row.id, name: row.exercise.name })}
                onEdit={() => setEditingExercise(row)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddExerciseSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddFromSheet}
        onPreview={(ex) => setPreviewExercise(ex)}
      />

      {previewExercise && (
        <ExercisePreview
          exercise={previewExercise}
          onAdd={() => { handleAddFromSheet(previewExercise); setPreviewExercise(null) }}
          onClose={() => setPreviewExercise(null)}
        />
      )}

      {editingExercise && (
        <ExerciseParamsEditor
          exercise={editingExercise}
          onSave={handleSaveParams}
          onClose={() => setEditingExercise(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar ejercicio"
        message={`Se eliminara "${pendingDelete?.name}" de este dia.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Modal para selección de múltiples días */}
      {multiDayAddEx && routineDays && (
        <div className="sheet-overlay">
          <div className="sheet" style={{ height: 'auto', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
            <h3 className="sheet__title" style={{ marginBottom: 'var(--space-2)' }}>Añadir a múltiples días</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              ¿En qué días deseas realizar <strong>{multiDayAddEx.name}</strong>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {routineDays.sort((a, b) => a.weekday - b.weekday).map(d => (
                <label 
                  key={d.id} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)', 
                    padding: 'var(--space-3)', background: 'var(--color-surface)', 
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: selectedDayIds.has(d.id) ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedDayIds.has(d.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedDayIds)
                      if (e.target.checked) newSet.add(d.id)
                      else newSet.delete(d.id)
                      setSelectedDayIds(newSet)
                    }}
                    style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: selectedDayIds.has(d.id) ? '600' : '500' }}>
                    {WEEKDAY_LABELS[d.weekday]} {d.id === dayId ? '(Actual)' : ''}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="secondary" size="md" onClick={() => setMultiDayAddEx(null)} fullWidth>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={confirmMultiDayAdd} fullWidth disabled={isAddingMulti || selectedDayIds.size === 0}>
                {isAddingMulti ? <HamsterLoader size={16} /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
