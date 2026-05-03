import { useState } from 'react'
import { Plus, ScanLine } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { showToast } from '../../../components/ui/Toast'
import { CreateRoutineDialog } from './CreateRoutineDialog'
import { RoutineCard } from './RoutineCard'
import { QrScannerDialog } from './QrScannerDialog'
import { HelpVideoButton } from '../../../components/ui/HelpVideo/HelpVideoButton'
import { addRoutineDay, duplicateRoutine } from '../../../services/routines.service'
import { useAuthStore } from '../../../stores/authStore'
import type { RoutineWithDays } from '../../../types/routine'
import './RoutinesList.css'

type RoutinesListProps = {
  routines: RoutineWithDays[]
  loading: boolean
  onSelectRoutine: (routine: RoutineWithDays) => void
  onAddRoutine: (name: string) => Promise<string | null>
  onRemoveRoutine: (id: string) => Promise<boolean>
  onToggleActive: (id: string, active: boolean) => Promise<boolean>
  onRefresh: () => Promise<void>
}

type PendingDelete = { id: string; name: string } | null
type PendingClone = { id: string; proposedName: string } | null

export function RoutinesList({
  routines,
  loading,
  onSelectRoutine,
  onAddRoutine,
  onRemoveRoutine,
  onToggleActive,
  onRefresh,
}: RoutinesListProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [pendingClone, setPendingClone] = useState<PendingClone>(null)
  const [cloningName, setCloningName] = useState('')
  const [cloning, setCloning] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  async function handleCreate(name: string, weekdays: number[]) {
    const routineId = await onAddRoutine(name)
    if (!routineId) {
      showToast('Error al crear rutina', 'error')
      return
    }
    for (const weekday of weekdays) {
      const { error } = await addRoutineDay(routineId, weekday)
      if (error) showToast(`Error al agregar dia: ${error}`, 'error')
    }
    await onRefresh()
    showToast('Rutina creada', 'success')
    setCreateOpen(false)
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    const success = await onRemoveRoutine(pendingDelete.id)
    if (success) showToast(`"${pendingDelete.name}" eliminada`, 'success')
    else showToast('Error al eliminar', 'error')
    setPendingDelete(null)
  }

  function handleRequestClone(routine: RoutineWithDays) {
    const proposed = `${routine.name} (copia)`
    setPendingClone({ id: routine.id, proposedName: proposed })
    setCloningName(proposed)
  }

  async function handleConfirmClone() {
    if (!pendingClone || !userId || cloning) return
    const finalName = cloningName.trim() || pendingClone.proposedName
    setCloning(true)
    const { error } = await duplicateRoutine(userId, pendingClone.id, finalName)
    setCloning(false)
    if (error) {
      showToast('Error al duplicar rutina', 'error')
    } else {
      showToast(`"${finalName}" creada`, 'success')
      await onRefresh()
    }
    setPendingClone(null)
    setCloningName('')
  }

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <HamsterLoader size={120} />
        <span className="loading-fullscreen__label">Cargando rutinas...</span>
      </div>
    )
  }

  return (
    <div className="routines-list">
      <div className="routines-list__header">
        <h1 className="routines-list__title">Mis Rutinas</h1>
        <div className="routines-list__actions">
          <HelpVideoButton sectionKey="routines_list" title="Tutorial: Mis Rutinas" />
          <IconButton
            icon={ScanLine}
            ariaLabel="Escanear QR de rutina"
            size="md"
            variant="ghost"
            onClick={() => setScannerOpen(true)}
          />
          <Button variant="primary" size="sm" cyber onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Nueva
          </Button>
        </div>
      </div>

      {routines.length === 0 && (
        <div className="routines-list__empty-state">
          <p className="routines-list__empty">No tienes rutinas aun</p>
          <Button variant="secondary" size="md" cyber onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Crear mi primera rutina
          </Button>
        </div>
      )}

      <div className="routines-list__items">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            onSelect={() => onSelectRoutine(routine)}
            onDelete={() => setPendingDelete({ id: routine.id, name: routine.name })}
            onToggle={() => onToggleActive(routine.id, !routine.is_active)}
            onDuplicate={() => handleRequestClone(routine)}
          />
        ))}
      </div>

      <CreateRoutineDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar rutina"
        message={`Se eliminará "${pendingDelete?.name}" y todos sus dias y ejercicios asociados. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {!!pendingClone && (
        <div className="clone-dialog-overlay" role="dialog" aria-modal="true" aria-label="Duplicar rutina">
          <div className="clone-dialog">
            <h2 className="clone-dialog__title">Duplicar rutina</h2>
            <p className="clone-dialog__desc">Puedes cambiar el nombre de la copia antes de crearla.</p>
            <input
              className="clone-dialog__input"
              type="text"
              value={cloningName}
              onChange={(e) => setCloningName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { void handleConfirmClone() } }}
              placeholder={pendingClone.proposedName}
              autoFocus
              disabled={cloning}
            />
            <div className="clone-dialog__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPendingClone(null); setCloningName('') }}
                disabled={cloning}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={cloning}
                onClick={() => { void handleConfirmClone() }}
                disabled={cloning || !cloningName.trim()}
              >
                Duplicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {scannerOpen && (
        <QrScannerDialog
          onClose={() => setScannerOpen(false)}
          onImported={onRefresh}
        />
      )}
    </div>
  )
}
