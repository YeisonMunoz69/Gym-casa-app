/* ============================================================
   QrScannerDialog.tsx — Dialog para escanear QR de rutina compartida
   FASE 05.5 v3 — GYM-YJMG
   Soporta:
     URL con ?share=UUID  → fetchRoutineSnapshot (nuevo)
     URL con ?r=BASE64    → decodeBase64ToPayload (legacy)
     Base64 directo       → decodeBase64ToPayload (fallback)
   Fix: botón "Abrir cámara" con capture="environment" para móvil.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import { ScanLine, X, Upload, Camera, Loader2 } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import {
  fetchRoutineSnapshot,
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

export function QrScannerDialog({ onClose, onImported }: QrScannerDialogProps) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef  = useRef<HTMLInputElement>(null)
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
    e.target.value = ''

    if (!rawQrData) {
      setScanError('No se encontró el QR en la imagen. Asegúrate de que el código esté bien visible y bien iluminado.')
      return
    }

    const resolved = await resolvePayloadFromQrData(rawQrData)
    if (!resolved.payload) {
      setScanError(resolved.error ?? 'Formato de QR no reconocido')
      return
    }
    setScannedPayload(resolved.payload)
  }

  async function handleConfirmImport() {
    if (!scannedPayload || !userId) return
    const payloadToImport = scannedPayload
    setScannedPayload(null) // Cierra el ConfirmDialog — el overlay toma el relevo
    setImporting(true)
    const { error } = await importSharedRoutine(userId, payloadToImport)
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
            {/* Área central de estado */}
            <div className="qr-scanner__frame">
              {scanning
                ? <Loader2 size={48} className="qr-scanner__icon qr-scanner__icon--spinning" />
                : <ScanLine size={56} className="qr-scanner__icon" />
              }
              <p className="qr-scanner__hint">
                {scanning ? 'Leyendo código QR...' : 'Elige una opción para escanear'}
              </p>
            </div>

            {scanError && <p className="qr-scanner__error">{scanError}</p>}

            {/* Inputs ocultos — uno por modalidad */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"   /* Abre cámara trasera directamente */
              hidden
              onChange={handleFileChange}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            {/* Botones de acceso — cámara + galería */}
            <div className="qr-scanner__btn-row">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={scanning}
                onClick={() => cameraRef.current?.click()}
              >
                <Camera size={16} />
                Abrir cámara
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                loading={scanning}
                onClick={() => galleryRef.current?.click()}
              >
                <Upload size={16} />
                Desde galería
              </Button>
            </div>

            <p className="qr-scanner__tip">
              Tip: si la cámara no lee el QR, usa "Desde galería" con una captura de pantalla del código.
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

      {/* Overlay de carga SKILL-DESIGN §2.1 — cubre pantalla completa al importar */}
      {importing && (
        <div className="loading-overlay">
          <HamsterLoader size={120} />
          <span className="loading-fullscreen__label">Importando rutina...</span>
        </div>
      )}
    </>
  )
}

/* ── Helpers ─────────────────────────────────────────────────── */

async function resolvePayloadFromQrData(
  rawData: string,
): Promise<{ payload: SharedRoutinePayload | null; error: string | null }> {
  try {
    const url = new URL(rawData)
    const shareId = url.searchParams.get('share')
    if (shareId) return fetchRoutineSnapshot(shareId)
    const base64 = url.searchParams.get('r')
    if (base64) return decodeBase64ToPayload(base64)
  } catch {
    // No es URL válida — intentar como Base64 directo (fallback)
  }
  return decodeBase64ToPayload(rawData)
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

/**
 * Decodifica un QR de un archivo de imagen.
 * Prueba 4 rotaciones x 2 resoluciones para manejar fotos de camara
 * con orientacion EXIF (0, 90, 180, 270 grados) que ctx.drawImage ignora.
 */
async function decodeQrFromFile(file: File): Promise<string | null> {
  const SIZES = [1800, 900]
  const ROTATIONS = [0, Math.PI / 2, Math.PI, -Math.PI / 2]

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const nw = img.naturalWidth  || img.width
      const nh = img.naturalHeight || img.height

      for (const maxSize of SIZES) {
        const scale = Math.min(1, maxSize / Math.max(nw, nh))
        const sw = Math.floor(nw * scale)
        const sh = Math.floor(nh * scale)

        for (const rad of ROTATIONS) {
          const portrait = rad === Math.PI / 2 || rad === -Math.PI / 2
          const cw = portrait ? sh : sw
          const ch = portrait ? sw : sh

          const canvas = document.createElement('canvas')
          canvas.width  = cw
          canvas.height = ch
          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          ctx.save()
          ctx.translate(cw / 2, ch / 2)
          ctx.rotate(rad)
          ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh)
          ctx.restore()

          const imageData = ctx.getImageData(0, 0, cw, ch)
          const code = jsQR(imageData.data, cw, ch, { inversionAttempts: 'attemptBoth' })
          if (code?.data) {
            resolve(code.data)
            return
          }
        }
      }

      resolve(null)
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
    img.src = objectUrl
  })
}
