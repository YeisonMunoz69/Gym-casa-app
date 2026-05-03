import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, X, Share2, Pencil } from 'lucide-react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { IconButton } from '../../../components/ui/IconButton'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { addRoutineDay, removeRoutineDay, renameRoutine } from '../../../services/routines.service'
import { DayExerciseList } from './DayExerciseList'
import { ShareRoutineModal } from './ShareRoutineModal'
import { HelpVideoButton } from '../../../components/ui/HelpVideo/HelpVideoButton'
import { WEEKDAY_LABELS } from '../../../types/routine'
import type { RoutineWithDays, RoutineDayRow } from '../../../types/routine'
import './RoutineDetail.css'

type RoutineDetailProps = {
  routine: RoutineWithDays
  onBack: () => void
  onRoutineChanged: () => void
}

export function RoutineDetail({ routine, onBack, onRoutineChanged }: RoutineDetailProps) {
  const [selectedDay, setSelectedDay] = useState<RoutineDayRow | null>(null)
  const [pendingDeleteDay, setPendingDeleteDay] = useState<{ id: string; weekday: number } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [renaming, setRenaming] = useState(false)
  const sortedDays = [...routine.routine_days].sort((a, b) => a.weekday - b.weekday)
  const assignedWeekdays = routine.routine_days.map((d) => d.weekday)
  const availableWeekdays = [0, 1, 2, 3, 4, 5, 6].filter(
    (w) => !assignedWeekdays.includes(w),
  )

  /** Auto-seleccionar el primer dia si no hay nada seleccionado */
  useEffect(() => {
    if (!selectedDay && sortedDays.length > 0) {
      setSelectedDay(sortedDays[0])
    }
  }, [routine.routine_days.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddDay(weekday: number) {
    const { error } = await addRoutineDay(routine.id, weekday)
    if (error) {
      showToast('Error al agregar dia', 'error')
    } else {
      showToast(`${WEEKDAY_LABELS[weekday]} agregado`, 'success')
      onRoutineChanged()
    }
  }

  async function handleRemoveDay(dayId: string, weekday: number) {
    if (selectedDay?.id === dayId) setSelectedDay(null)
    const { error } = await removeRoutineDay(dayId)
    if (error) {
      showToast('Error al eliminar dia', 'error')
    } else {
      showToast(`${WEEKDAY_LABELS[weekday]} eliminado`, 'success')
      onRoutineChanged()
    }
  }

  async function handleConfirmRename() {
    const nextName = renameDraft.trim()
    if (!nextName || nextName === routine.name) { setRenameOpen(false); return }
    setRenaming(true)
    const { error } = await renameRoutine(routine.id, nextName)
    setRenaming(false)
    if (error) {
      showToast('Error al renombrar', 'error')
    } else {
      showToast('Rutina renombrada', 'success')
      setRenameOpen(false)
      onRoutineChanged()
    }
  }

  return (
    <div className="routine-detail">
      <div className="routine-detail__header">
        <IconButton icon={ArrowLeft} ariaLabel="Volver a rutinas" onClick={onBack} size="md" />
        <h2 className="routine-detail__title">{routine.name}</h2>
        <IconButton
          icon={Pencil}
          ariaLabel="Renombrar rutina"
          size="md"
          variant="ghost"
          onClick={() => { setRenameDraft(routine.name); setRenameOpen(true) }}
        />
        <HelpVideoButton sectionKey="routine_detail" title="Tutorial: Editar Rutina" />
        <IconButton
          icon={Share2}
          ariaLabel="Compartir rutina"
          size="md"
          variant="ghost"
          onClick={() => setShowShareModal(true)}
        />
      </div>

      <div className="routine-detail__days-section">
        <h3 className="routine-detail__subtitle">Dias asignados</h3>
        <div className="routine-detail__day-chips">
          {sortedDays.map((day) => (
            <button
              key={day.id}
              className={`day-chip ${selectedDay?.id === day.id ? 'day-chip--selected' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span>{WEEKDAY_LABELS[day.weekday]}</span>
              <span
                className="day-chip__remove"
                role="button"
                tabIndex={0}
                aria-label={`Eliminar ${WEEKDAY_LABELS[day.weekday]}`}
                onClick={(e) => { e.stopPropagation(); setPendingDeleteDay({ id: day.id, weekday: day.weekday }) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setPendingDeleteDay({ id: day.id, weekday: day.weekday }) } }}
              >
                <X size={12} />
              </span>
            </button>
          ))}

          {availableWeekdays.length > 0 && (
            <div className="routine-detail__add-day">
              <select
                className="routine-detail__day-select"
                value=""
                onChange={(e) => handleAddDay(Number(e.target.value))}
              >
                <option value="" disabled>Agregar dia...</option>
                {availableWeekdays.map((w) => (
                  <option key={w} value={w}>{WEEKDAY_LABELS[w]}</option>
                ))}
              </select>
              <Plus size={14} className="routine-detail__add-icon" />
            </div>
          )}
        </div>
      </div>

      {selectedDay && (
        <DayExerciseList
          key={selectedDay.id}
          dayId={selectedDay.id}
          dayLabel={WEEKDAY_LABELS[selectedDay.weekday]}
          routineDays={sortedDays}
        />
      )}

      {!selectedDay && sortedDays.length === 0 && (
        <p className="routine-detail__hint">Agrega un dia para empezar</p>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteDay}
        title="Eliminar día"
        message={`¿Estás seguro de que deseas eliminar el día ${pendingDeleteDay ? WEEKDAY_LABELS[pendingDeleteDay.weekday] : ''
          } de esta rutina? Se perderán los ejercicios asignados a él.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteDay) {
            handleRemoveDay(pendingDeleteDay.id, pendingDeleteDay.weekday)
            setPendingDeleteDay(null)
          }
        }}
        onCancel={() => setPendingDeleteDay(null)}
      />

      {showShareModal && (
        <ShareRoutineModal
          routineId={routine.id}
          routineName={routine.name}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {renameOpen && (
        <div className="clone-dialog-overlay" role="dialog" aria-modal="true" aria-label="Renombrar rutina">
          <div className="clone-dialog">
            <h2 className="clone-dialog__title">Renombrar rutina</h2>
            <p className="clone-dialog__desc">Escribe el nuevo nombre para esta rutina.</p>
            <input
              className="clone-dialog__input"
              type="text"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { void handleConfirmRename() } }}
              placeholder={routine.name}
              autoFocus
              disabled={renaming}
            />
            <div className="clone-dialog__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRenameOpen(false)}
                disabled={renaming}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={renaming}
                onClick={() => { void handleConfirmRename() }}
                disabled={renaming || !renameDraft.trim()}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
