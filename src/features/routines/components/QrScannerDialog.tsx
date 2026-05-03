/* ============================================================
   QrScannerDialog.tsx — Dialog para escanear QR de rutina compartida
   FASE 05.5 fix v2 — GYM-YJMG
   Fixes: extraer param ?r= de la URL antes de decodificar,
   redimensionar imagen grande antes de pasar a jsQR,
   eliminar capture forzado para permitir galería.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import { ScanLine, X, Upload, Loader2 } from 'lucide-react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import {
  decodeBase64ToPayload,
  importSharedRoutine,
} from '../../../services/routines.share.service'
import { WEEKDAY_LABELS } from '../../../types/routine'
import type { SharedRoutinePayload } from '../../../types/routine'
import './QrScannerDialog.css'

type QrScannerDialogProps = {
  onClose: () => void
  onImported: () => void
}

/** Extrae el parámetro ?r= de una URL, o devuelve el string tal cual si ya es base64 */
function extractBase64FromQrData(data: string): string {
  try {
    const url = new URL(data)
    const r = url.searchParams.get('r')
    if (r) return r
  } catch {
    // No es URL válida — puede ser base64 directo
  }
  return data
}

export function QrScannerDialog({ onClose, onImported }: QrScannerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userId = useAuthStore((s) => s.user?.id)

  const [scannedPayload, setScannedPayload] = useState<SharedRoutinePayload | null>(null)
  const [importing, setImporting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanError(null)
    setScanning(true)

    const rawQrData = await decodeQrFromFile(file)
    setScanning(false)

    if (!rawQrData) {
      setScanError('No se encontró ningún QR en la imagen. Asegúrate de que el QR sea visible y esté bien iluminado.')
      return
    }

    // CRÍTICO: extraer solo el base64 del parámetro ?r= de la URL del QR
    const base64 = extractBase64FromQrData(rawQrData)
    const { payload, error } = decodeBase64ToPayload(base64)

    if (error || !payload) {
      setScanError(`QR inválido: ${error ?? 'formato no reconocido'}`)
      return
    }

    setScannedPayload(payload)
    e.target.value = ''
  }

  async function handleConfirmImport() {
    if (!scannedPayload || !userId) return
    setImporting(true)
    const { error } = await importSharedRoutine(userId, scannedPayload)
    setImporting(false)
    if (error) { showToast(`Error al importar: ${error}`, 'error'); return }
    showToast('Rutina importada correctamente', 'success')
    onImported()
    onClose()
  }

  const totalExercises = scannedPayload?.days.reduce((s, d) => s + d.exercises.length, 0) ?? 0

  return (
    <>
      <div className="qr-scanner__overlay" onClick={onClose}>
        <div className="qr-scanner" onClick={(e) => e.stopPropagation()}>
          <div className="qr-scanner__header">
            <h2 className="qr-scanner__title">Escanear rutina</h2>
            <button className="qr-scanner__close" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <div className="qr-scanner__body">
            {/* Zona de carga — sin capture para permitir galería Y cámara */}
            <div className="qr-scanner__frame" onClick={() => !scanning && fileInputRef.current?.click()}>
              {scanning
                ? <Loader2 size={48} className="qr-scanner__icon qr-scanner__icon--spinning" />
                : <ScanLine size={56} className="qr-scanner__icon" />
              }
              <p className="qr-scanner__hint">
                {scanning ? 'Leyendo código QR...' : 'Toca para abrir cámara o galería'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </div>

            {scanError && <p className="qr-scanner__error">{scanError}</p>}

            <Button
              variant="secondary"
              size="md"
              fullWidth
              loading={scanning}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              {scanning ? 'Procesando...' : 'Seleccionar imagen del QR'}
            </Button>

            <p className="qr-scanner__tip">
              Tip: haz captura de pantalla del QR y cárgala aquí para mejores resultados
            </p>
          </div>
        </div>
      </div>

      {scannedPayload && (
        <ConfirmDialog
          isOpen
          title="Importar rutina"
          message={buildImportMessage(scannedPayload, totalExercises)}
          confirmLabel={importing ? 'Importando...' : 'Importar'}
          variant="primary"
          onConfirm={handleConfirmImport}
          onCancel={() => setScannedPayload(null)}
        />
      )}
    </>
  )
}

function buildImportMessage(payload: SharedRoutinePayload, total: number): string {
  const days = payload.days.map((d) => WEEKDAY_LABELS[d.weekday]).join(', ')
  return (
    `¿Deseas importar "${payload.routineName}"?\n` +
    `${payload.days.length} día(s): ${days}\n` +
    `${total} ejercicio(s) en total.\n\n` +
    `Se creará una copia independiente en tus rutinas.`
  )
}

/** Decodifica un QR desde archivo imagen con jsQR.
 *  Redimensiona imágenes grandes a máx 1024px para evitar fallos. */
async function decodeQrFromFile(file: File): Promise<string | null> {
  const MAX_SIZE = 1024
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      // Calcular escala para no exceder MAX_SIZE en ninguna dimensión
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height))
      const w = Math.floor(img.width * scale)
      const h = Math.floor(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(objectUrl); resolve(null); return }

      // Dibujar redimensionado
      ctx.drawImage(img, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)

      // Intentar escanear con inversión de colores como fallback
      let code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' })
      URL.revokeObjectURL(objectUrl)
      resolve(code?.data ?? null)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
    img.src = objectUrl
  })
}
