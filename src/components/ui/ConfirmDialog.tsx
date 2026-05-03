import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import './ConfirmDialog.css'

type ConfirmDialogProps = {
  isOpen: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirmar accion',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  async function handleConfirm() {
    if (confirming) return
    setConfirming(true)
    try {
      await onConfirm()
    } finally {
      // Si el padre ya cerró el dialog (isOpen=false), el componente se desmontó
      // React 18 ignora setState en componentes desmontados
      setConfirming(false)
    }
  }

  function handleOverlayClick() {
    // Bloquear cierre accidental en móvil mientras opera
    if (confirming) return
    onCancel()
  }

  return createPortal(
    <div className="confirm-overlay" onClick={handleOverlayClick}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__icon-wrap" data-variant={variant}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <Button
            variant="ghost"
            size="md"
            disabled={confirming}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            loading={confirming}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
