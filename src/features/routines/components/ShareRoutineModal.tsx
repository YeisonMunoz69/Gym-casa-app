/* ============================================================
   ShareRoutineModal.tsx — Modal de compartir rutina por QR
   FASE 05.5 — GYM-YJMG
   Responsabilidad: mostrar QR + opción copiar link para una rutina.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Share2 } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import {
  exportRoutinePayload,
  encodePayloadToBase64,
} from '../../../services/routines.share.service'
import './ShareRoutineModal.css'

type ShareRoutineModalProps = {
  routineId: string
  routineName: string
  onClose: () => void
}

export function ShareRoutineModal({ routineId, routineName, onClose }: ShareRoutineModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function buildShareUrl() {
      setLoading(true)
      const { payload, error: exportErr } = await exportRoutinePayload(routineId)
      if (exportErr || !payload) {
        setError(exportErr ?? 'Error al exportar rutina')
        setLoading(false)
        return
      }
      const base64 = encodePayloadToBase64(payload)
      const url = `${window.location.origin}/import?r=${base64}`
      setShareUrl(url)
      setLoading(false)
    }
    buildShareUrl()
  }, [routineId])

  async function handleCopyLink() {
    if (!shareUrl) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        // Fallback para móviles que bloquean clipboard API
        const el = document.createElement('textarea')
        el.value = shareUrl
        el.setAttribute('readonly', '')
        el.style.cssText = 'position:absolute;left:-9999px;top:-9999px;'
        document.body.appendChild(el)
        el.focus()
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      showToast('Link copiado al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      showToast('No se pudo copiar. Copia la URL manualmente.', 'error')
    }
  }

  async function handleNativeShare() {
    if (!shareUrl || !navigator.share) return
    try {
      await navigator.share({
        title: `Rutina: ${routineName}`,
        text: 'Te comparto mi rutina de entrenamiento',
        url: shareUrl,
      })
    } catch {
      // Usuario canceló — no mostrar error
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="share-modal__overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal__header">
          <h2 className="share-modal__title">Compartir rutina</h2>
          <button className="share-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <p className="share-modal__subtitle">{routineName}</p>

        <div className="share-modal__qr-area">
          {loading && (
            <div className="share-modal__loading">
              <HamsterLoader size={80} />
              <span className="loading-fullscreen__label">Generando QR...</span>
            </div>
          )}

          {error && (
            <p className="share-modal__error">{error}</p>
          )}

          {!loading && !error && shareUrl && (
            <div className="share-modal__qr-wrapper">
              <QRCodeSVG
                value={shareUrl}
                size={200}
                bgColor="transparent"
                fgColor="hsl(168, 72%, 45%)"
                level="M"
              />
            </div>
          )}
        </div>

        {!loading && !error && shareUrl && (
          <div className="share-modal__actions">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleCopyLink}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>

            {hasNativeShare && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleNativeShare}
              >
                <Share2 size={16} />
                Compartir
              </Button>
            )}
          </div>
        )}

        <p className="share-modal__hint">
          Quien escanee este QR podrá importar una copia independiente de esta rutina.
        </p>
      </div>
    </div>
  )
}
