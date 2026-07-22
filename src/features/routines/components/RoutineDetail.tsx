/* ============================================================
   RoutineDetail.tsx — Detalle y edición de días de una rutina
   FASE 05.5 — GYM-YJMG
   Responsabilidad: coordinar vista/edición de una rutina y sus días.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { ArrowLeft, Share2, Pencil, Download } from 'lucide-react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { IconButton } from '../../../components/ui/IconButton'
import { showToast } from '../../../components/ui/Toast'
import { removeRoutineDay, addRoutineDay } from '../../../services/routines.service'
import { DayExerciseList } from './DayExerciseList'
import { ShareRoutineModal } from './ShareRoutineModal'
import { ExportRoutineModal } from './ExportRoutineModal'
import { RenameRoutineDialog } from './RenameRoutineDialog'
import { AddDayCopyDialog } from './AddDayCopyDialog'
import { RoutineDaysBar } from './RoutineDaysBar'
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
  const [showExportModal, setShowExportModal] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [pendingAddDay, setPendingAddDay] = useState<number | null>(null)

  const sortedDays = [...routine.routine_days].sort((a, b) => a.weekday - b.weekday)
  const assignedWeekdays = routine.routine_days.map((d) => d.weekday)
  const availableWeekdays = [0, 1, 2, 3, 4, 5, 6].filter((w) => !assignedWeekdays.includes(w))

  useEffect(() => {
    if (!selectedDay && sortedDays.length > 0) {
      setSelectedDay(sortedDays[0])
    }
  }, [routine.routine_days.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRemoveDay(dayId: string, weekday: number) {
    if (selectedDay?.id === dayId) setSelectedDay(null)
    const { error } = await removeRoutineDay(dayId)
    if (error) {
      showToast('Error al eliminar día', 'error')
    } else {
      showToast(`${WEEKDAY_LABELS[weekday]} eliminado`, 'success')
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
          onClick={() => setRenameOpen(true)}
        />
        <HelpVideoButton sectionKey="routine_detail" title="Tutorial: Editar Rutina" />
        <IconButton
          icon={Download}
          ariaLabel="Descargar rutina (.md)"
          size="md"
          variant="ghost"
          onClick={() => setShowExportModal(true)}
        />
        <IconButton
          icon={Share2}
          ariaLabel="Compartir rutina"
          size="md"
          variant="ghost"
          onClick={() => setShowShareModal(true)}
        />
      </div>

      <RoutineDaysBar
        sortedDays={sortedDays}
        selectedDay={selectedDay}
        availableWeekdays={availableWeekdays}
        onSelectDay={setSelectedDay}
        onRequestDeleteDay={(id, weekday) => setPendingDeleteDay({ id, weekday })}
        onSelectAddDay={(weekday) => {
          if (selectedDay) {
            setPendingAddDay(weekday)
          } else {
            void addRoutineDay(routine.id, weekday).then(({ error }) => {
              if (error) showToast('Error al agregar día', 'error')
              else { showToast(`${WEEKDAY_LABELS[weekday]} agregado`, 'success'); onRoutineChanged() }
            })
          }
        }}
      />

      {selectedDay && (
        <DayExerciseList
          key={selectedDay.id}
          dayId={selectedDay.id}
          dayLabel={WEEKDAY_LABELS[selectedDay.weekday]}
          routineDays={sortedDays}
        />
      )}

      {!selectedDay && sortedDays.length === 0 && (
        <p className="routine-detail__hint">Agrega un día para empezar</p>
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
            void handleRemoveDay(pendingDeleteDay.id, pendingDeleteDay.weekday)
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

      {showExportModal && (
        <ExportRoutineModal
          routineId={routine.id}
          routineName={routine.name}
          onClose={() => setShowExportModal(false)}
        />
      )}

      <RenameRoutineDialog
        isOpen={renameOpen}
        routineId={routine.id}
        currentName={routine.name}
        onClose={() => setRenameOpen(false)}
        onRenamed={onRoutineChanged}
      />

      <AddDayCopyDialog
        pendingAddDay={pendingAddDay}
        selectedDayId={selectedDay?.id ?? null}
        selectedDayWeekday={selectedDay?.weekday ?? null}
        routineId={routine.id}
        onClose={() => setPendingAddDay(null)}
        onSuccess={onRoutineChanged}
      />
    </div>
  )
}
