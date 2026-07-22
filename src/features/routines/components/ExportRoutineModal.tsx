/* ============================================================
   ExportRoutineModal.tsx — Modal de confirmación de descarga de rutina
   FASE 05.5 — GYM-YJMG
   Responsabilidad: confirmar y ejecutar descarga de rutina en .md.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState } from 'react'
import { X, Download, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import { exportRoutineAsMarkdown } from '../../../services/routines.export.service'
import './ExportRoutineModal.css'

type ExportRoutineModalProps = {
  routineId: string
  routineName: string
  onClose: () => void
}

export function ExportRoutineModal({ routineId, routineName, onClose }: ExportRoutineModalProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const [exporting, setExporting] = useState(false)

  async function handleConfirmExport() {
    if (!userId) {
      showToast('Debes iniciar sesión para descargar la rutina', 'error')
      return
    }

    setExporting(true)
    const { error } = await exportRoutineAsMarkdown(routineId, userId)
    setExporting(false)

    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Rutina descargada en formato .md', 'success')
      onClose()
    }
  }

  return (
    <div className="export-modal__overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal__header">
          <h2 className="export-modal__title">Descargar rutina</h2>
          <button className="export-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <p className="export-modal__subtitle">
          ¿Confirmas la descarga de la rutina <strong>{routineName}</strong> en tu dispositivo?
        </p>

        <div className="export-modal__info-box">
          <div className="export-modal__info-item">
            <FileText size={20} className="export-modal__info-icon" />
            <div>
              <span className="export-modal__info-title">Formato legible (.md)</span>
              <span className="export-modal__info-desc">
                Archivo de texto estructurado en Markdown, compatible con notas de tu móvil, PC o imprimir.
              </span>
            </div>
          </div>

          <div className="export-modal__info-item">
            <CheckCircle2 size={20} className="export-modal__info-icon" />
            <div>
              <span className="export-modal__info-title">Información completa</span>
              <span className="export-modal__info-desc">
                Incluye todos los días, ejercicios en orden, repeticiones, series, RIR, descansos y notas.
              </span>
            </div>
          </div>
        </div>

        <div className="export-modal__actions">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={exporting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={exporting}
            onClick={() => { void handleConfirmExport() }}
          >
            <Download size={16} />
            Descargar .md
          </Button>
        </div>
      </div>
    </div>
  )
}
