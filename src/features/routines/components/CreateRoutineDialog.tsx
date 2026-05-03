import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { WEEKDAY_LABELS } from '../../../types/routine'
import './CreateRoutineDialog.css'

type CreateRoutineDialogProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, weekdays: number[]) => Promise<void>
}

export function CreateRoutineDialog({ isOpen, onClose, onCreate }: CreateRoutineDialogProps) {
  const [name, setName] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  function toggleDay(weekday: number) {
    setSelectedDays((prev) =>
      prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday],
    )
  }

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    await onCreate(name.trim(), selectedDays)
    setName('')
    setSelectedDays([])
    setSaving(false)
  }

  function handleClose() {
    if (saving) return // No cerrar mientras guarda
    setName('')
    setSelectedDays([])
    onClose()
  }

  const allWeekdays = [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo

  return (
    <div className="create-overlay" onClick={handleClose}>
      <div className="create-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="create-dialog__header">
          <h3 className="create-dialog__title">Nueva rutina</h3>
          <IconButton icon={X} ariaLabel="Cerrar" size="sm" onClick={handleClose} />
        </div>

        <div className="create-dialog__field">
          <label className="create-dialog__label" htmlFor="routine-name">
            Nombre de la rutina
          </label>
          <input
            id="routine-name"
            className="create-dialog__input"
            placeholder="Ej: Push-Pull-Legs, Full Body..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>

        <div className="create-dialog__field">
          <label className="create-dialog__label">Dias de entrenamiento</label>
          <p className="create-dialog__hint">Puedes agregar o cambiar dias despues</p>
          <div className="create-dialog__days">
            {allWeekdays.map((w) => (
              <button
                key={w}
                className={`create-dialog__day-btn ${selectedDays.includes(w) ? 'create-dialog__day-btn--active' : ''}`}
                onClick={() => toggleDay(w)}
                type="button"
              >
                {WEEKDAY_LABELS[w].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={!name.trim()}
          onClick={handleCreate}
        >
          <Plus size={16} />
          Crear rutina
        </Button>
      </div>
    </div>
  )
}
