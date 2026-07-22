/* ============================================================
   RenameRoutineDialog.tsx — Diálogo modal para renombrar rutina
   FASE 05.5 — GYM-YJMG
   Responsabilidad: editar y persistir el nombre de una rutina.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { renameRoutine } from '../../../services/routines.service'

type RenameRoutineDialogProps = {
  isOpen: boolean
  routineId: string
  currentName: string
  onClose: () => void
  onRenamed: () => void
}

export function RenameRoutineDialog({
  isOpen,
  routineId,
  currentName,
  onClose,
  onRenamed,
}: RenameRoutineDialogProps) {
  const [draft, setDraft] = useState(currentName)
  const [renaming, setRenaming] = useState(false)

  useEffect(() => {
    if (isOpen) setDraft(currentName)
  }, [isOpen, currentName])

  if (!isOpen) return null

  async function handleConfirm() {
    const nextName = draft.trim()
    if (!nextName || nextName === currentName) {
      onClose()
      return
    }
    setRenaming(true)
    const { error } = await renameRoutine(routineId, nextName)
    setRenaming(false)

    if (error) {
      showToast('Error al renombrar rutina', 'error')
    } else {
      showToast('Rutina renombrada', 'success')
      onClose()
      onRenamed()
    }
  }

  return (
    <div className="clone-dialog-overlay" role="dialog" aria-modal="true" aria-label="Renombrar rutina">
      <div className="clone-dialog">
        <h2 className="clone-dialog__title">Renombrar rutina</h2>
        <p className="clone-dialog__desc">Escribe el nuevo nombre para esta rutina.</p>
        <input
          className="clone-dialog__input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { void handleConfirm() } }}
          placeholder={currentName}
          autoFocus
          disabled={renaming}
        />
        <div className="clone-dialog__actions">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={renaming}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={renaming}
            onClick={() => { void handleConfirm() }}
            disabled={renaming || !draft.trim()}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
