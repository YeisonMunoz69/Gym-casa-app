/* ============================================================
   AddDayCopyDialog.tsx — Diálogo para copiar ejercicios a un nuevo día
   FASE 05.5 — GYM-YJMG
   Responsabilidad: confirmar si se copia el día actual o se agrega vacío.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { addRoutineDay, addRoutineDayWithCopy } from '../../../services/routines.service'
import { WEEKDAY_LABELS } from '../../../types/routine'

type AddDayCopyDialogProps = {
  pendingAddDay: number | null
  selectedDayId: string | null
  selectedDayWeekday: number | null
  routineId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddDayCopyDialog({
  pendingAddDay,
  selectedDayId,
  selectedDayWeekday,
  routineId,
  onClose,
  onSuccess,
}: AddDayCopyDialogProps) {
  if (pendingAddDay === null || !selectedDayId || selectedDayWeekday === null) return null

  const targetLabel = WEEKDAY_LABELS[pendingAddDay] ?? `Día ${pendingAddDay}`
  const sourceLabel = WEEKDAY_LABELS[selectedDayWeekday] ?? `Día ${selectedDayWeekday}`

  async function handleConfirm(copy: boolean) {
    if (pendingAddDay === null || !selectedDayId) return
    const weekday = pendingAddDay
    onClose()

    if (copy) {
      const { error } = await addRoutineDayWithCopy(routineId, weekday, selectedDayId)
      if (error) {
        showToast('Error al copiar día', 'error')
      } else {
        showToast(`${targetLabel} agregado con copia`, 'success')
        onSuccess()
      }
    } else {
      const { error } = await addRoutineDay(routineId, weekday)
      if (error) {
        showToast('Error al agregar día', 'error')
      } else {
        showToast(`${targetLabel} agregado`, 'success')
        onSuccess()
      }
    }
  }

  return (
    <div className="clone-dialog-overlay" role="dialog" aria-modal="true" aria-label="Copiar día">
      <div className="clone-dialog">
        <h2 className="clone-dialog__title">Agregar día</h2>
        <p className="clone-dialog__desc">
          ¿Quieres copiar los ejercicios de <strong>{sourceLabel}</strong> a tu nuevo día <strong>{targetLabel}</strong>?
        </p>
        <div className="clone-dialog__actions" style={{ flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <Button variant="primary" fullWidth onClick={() => { void handleConfirm(true) }}>
            Sí, copiar ejercicios
          </Button>
          <Button variant="secondary" fullWidth onClick={() => { void handleConfirm(false) }}>
            No, agregar vacío
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
