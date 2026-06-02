/* ============================================================
   AIInfoBadge.tsx — Botón "?" que explica un algoritmo de IA
   GYM-YJMG — Componente reutilizable

   Uso:
     <AIInfoBadge title="1RM Estimado">
       <p>Explicación del modelo...</p>
     </AIInfoBadge>

   Renderiza un badge "IA ?" que al hacer click abre un InfoDialog
   con el contenido pasado como children.
   ============================================================ */
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { InfoDialog } from './InfoDialog'
import './AIInfoBadge.css'

type AIInfoBadgeProps = {
  title:    string
  children: React.ReactNode
  /** Si true, muestra solo el ícono sin el label "IA" */
  compact?: boolean
}

export function AIInfoBadge({ title, children, compact = false }: AIInfoBadgeProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className={`ai-info-badge ${compact ? 'ai-info-badge--compact' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={`¿Cómo funciona? ${title}`}
        title={`¿Cómo funciona? ${title}`}
        type="button"
      >
        {!compact && <span className="ai-info-badge__label">IA</span>}
        <HelpCircle size={compact ? 16 : 14} />
      </button>

      <InfoDialog isOpen={open} title={title} onClose={() => setOpen(false)}>
        {children}
      </InfoDialog>
    </>
  )
}
