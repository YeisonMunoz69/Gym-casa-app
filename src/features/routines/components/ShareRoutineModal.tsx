/* ============================================================
   ShareRoutineModal.tsx — Modal de compartir rutina por QR
   FASE 05.5 v3 — GYM-YJMG
   Responsabilidad: subir snapshot → generar URL corta → mostrar QR.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Share2 } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import {
  buildRoutinePayload,
  uploadRoutineSnapshot,
} from '../../../services/routines.share.service'
import './ShareRoutineModal.css'

type ShareRoutineModalProps = {
  routineId: string
  routineName: string
  onClose: () => void
}

export function ShareRoutineModal({ routineId, routineName, onClose }: ShareRoutineModalProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!userId) { setError('Debes iniciar sesión para compartir'); setLoading(false); return }
    generateShareUrl(userId)
  }, [routineId, userId])

  async function generateShareUrl(uid: string) {
    setLoading(true)
    setError(null)

    const { payload, error: buildErr } = await buildRoutinePayload(routineId, uid)
    if (buildErr || !payload) {
      setError(buildErr ?? 'Error al leer la rutina')
      setLoading(false)
      return
    }

    const { shareId, error: uploadErr } = await uploadRoutineSnapshot(uid, payload)
    if (uploadErr || !shareId) {
      setError(uploadErr ?? 'Error al subir la rutina')
      setLoading(false)
      return
    }

    setShareUrl(`${window.location.origin}/import?share=${shareId}`)
    setLoading(false)
  }

  async function handleCopyLink() {
    if (!shareUrl) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
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

          {error && <p className="share-modal__error">{error}</p>}

          {!loading && !error && shareUrl && (
            <div className="share-modal__qr-wrapper">
              <QRCodeSVG
                value={shareUrl}
                size={200}
                bgColor="transparent"
                fgColor="hsl(168, 72%, 45%)"
                level="L"
              />
            </div>
          )}
        </div>

        {!loading && !error && shareUrl && (
          <div className="share-modal__actions">
            <Button variant="secondary" size="md" fullWidth onClick={handleCopyLink}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>

            {hasNativeShare && (
              <Button variant="primary" size="md" fullWidth onClick={handleNativeShare}>
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
