/* ============================================================
   HelpVideoButton.tsx — Botón flotante para abrir videos de ayuda
   FASE 06 — GYM-YJMG
   ============================================================ */
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { HelpVideoModal } from './HelpVideoModal'
import { Button } from '../Button'
import { useHelpAnimation } from './hooks/useHelpAnimation'
import './HelpVideoButton.css'

type HelpVideoButtonProps = {
  sectionKey: string
  title?: string
}

export function HelpVideoButton({ sectionKey, title }: HelpVideoButtonProps) {
  const [open, setOpen] = useState(false)
  const { helpAnimationsEnabled } = useHelpAnimation()

  return (
    <>
      <div className={`help-fab-wrapper ${!helpAnimationsEnabled ? 'help-fab-wrapper--static' : ''}`}>
        {helpAnimationsEnabled && (
          <>
            <div className="help-fab-glow"></div>
            <div className="help-fab__dots-border"></div>
          </>
        )}
        <div className="help-fab-btn-container">
          <Button variant="primary" size="sm" cyber={helpAnimationsEnabled} onClick={() => setOpen(true)} ariaLabel="Ver video de ayuda">
            <HelpCircle size={16} className={helpAnimationsEnabled ? "help-fab__icon" : ""} />
          </Button>
        </div>
      </div>

      {open && (
        <HelpVideoModal 
          sectionKey={sectionKey} 
          defaultTitle={title} 
          onClose={() => setOpen(false)} 
        />
      )}
    </>
  )
}
