/* ============================================================
   InfoDialog.tsx — Dialog informativo (sin acción destructiva)
   Reutilizable. Sin emojis (SKILL-CODE §5.4).
   ============================================================ */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Info } from 'lucide-react'
import './InfoDialog.css'

type InfoDialogProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function InfoDialog({ isOpen, title, onClose, children }: InfoDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="info-overlay" onClick={onClose}>
      <div className="info-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="info-dialog__header">
          <div className="info-dialog__icon-wrap">
            <Info size={20} />
          </div>
          <h3 className="info-dialog__title">{title}</h3>
          <button className="info-dialog__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Contenido inyectado */}
        <div className="info-dialog__content">
          {children}
        </div>

        {/* CTA de cierre */}
        <button className="info-dialog__dismiss" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  )
}
