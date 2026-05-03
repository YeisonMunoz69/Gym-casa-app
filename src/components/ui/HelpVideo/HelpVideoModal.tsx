/* ============================================================
   HelpVideoModal.tsx — Modal para mostrar el video
   FASE 06 — GYM-YJMG
   ============================================================ */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Check, Loader, PlayCircle, ExternalLink } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { showToast } from '../Toast'
import './HelpVideoModal.css'

type HelpVideoModalProps = {
  sectionKey: string
  defaultTitle?: string
  onClose: () => void
}

const SUPER_ADMIN_ID = import.meta.env.VITE_SUPER_ADMIN_ID as string ?? ''

export function HelpVideoModal({ sectionKey, defaultTitle = 'Ayuda', onClose }: HelpVideoModalProps) {
  const userId = useAuthStore(s => s.user?.id)
  const isSuperAdmin = userId === SUPER_ADMIN_ID

  const [videoUrl, setVideoUrl] = useState<string>('')
  const [title, setTitle] = useState<string>(defaultTitle)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draftUrl, setDraftUrl] = useState('')
  const [saving, setSaving] = useState(false)
  // Si el iframe falla (Error 153, dominio bloqueado) usamos el fallback
  const [iframeBlocked, setIframeBlocked] = useState(false)

  // En desarrollo local (IP de red o localhost), YouTube bloquea el embed.
  // En producción con dominio real, el iframe funciona en PC Y mobile.
  const isLocalDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    /^192\.168\./.test(window.location.hostname) ||
    /^10\./.test(window.location.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(window.location.hostname)
  )

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('help_videos')
        .select('*')
        .eq('section_key', sectionKey)
        .maybeSingle()

      if (data) {
        setVideoUrl(data.video_url)
        setTitle(data.title)
      }
      setLoading(false)
    }
    load()
  }, [sectionKey])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('help_videos').upsert({
      section_key: sectionKey,
      video_url: draftUrl,
      title: title || 'Video de Ayuda',
      updated_at: new Date().toISOString()
    }, { onConflict: 'section_key' })

    if (error) {
      showToast('Error al guardar link', 'error')
      console.error(error)
    } else {
      showToast('Video actualizado', 'success')
      setVideoUrl(draftUrl)
      setEditing(false)
    }
    setSaving(false)
  }

  /** Extrae el videoId limpio desde cualquier formato de URL de YouTube */
  function getVideoId(rawUrl: string): string | null {
    if (!rawUrl) return null
    let url = rawUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    try {
      const parsed = new URL(url)
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.includes('/watch')) return parsed.searchParams.get('v')
        if (parsed.pathname.includes('/shorts/')) return parsed.pathname.split('/shorts/')[1].split('?')[0]
      }
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.substring(1).split('?')[0]
    } catch { /* ignorar */ }
    return null
  }

  function getEmbedUrl(rawUrl: string): string {
    const id = getVideoId(rawUrl)
    if (!id) return ''
    return `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`
  }

  function getDirectUrl(rawUrl: string): string {
    const id = getVideoId(rawUrl)
    if (id) return `https://www.youtube.com/watch?v=${id}`
    return rawUrl
  }

  const modalContent = (
    <div className="help-video-overlay" onClick={onClose}>
      <div className="help-video-modal" onClick={e => e.stopPropagation()}>
        <div className="help-video-modal__header">
          <h3 className="help-video-modal__title">{title}</h3>
          <button className="help-video-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="help-video">
          {loading ? (
            <div className="help-video__loading">
              <Loader size={24} className="spinner" />
            </div>
          ) : (
          <>
            {!videoUrl && !isSuperAdmin ? (
              <p className="help-video__empty">No hay tutorial disponible para esta sección aún.</p>
            ) : (
              <div className="help-video__frame-wrap">
                {videoUrl ? (
                  <>
                    {/* Fallback: si estamos en red local (dev) o si el iframe fue bloqueado */}
                    {(isLocalDev || iframeBlocked) ? (
                      <div className="help-video__mobile-player">
                        <img
                          className="help-video__thumbnail"
                          src={`https://img.youtube.com/vi/${getVideoId(videoUrl)}/hqdefault.jpg`}
                          alt="Miniatura del tutorial"
                        />
                        <div className="help-video__mobile-overlay">
                          <a
                            className="help-video__yt-btn"
                            href={getDirectUrl(videoUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <PlayCircle size={28} />
                            <span>Ver tutorial en YouTube</span>
                            <ExternalLink size={14} className="help-video__yt-btn-ext" />
                          </a>
                          <p className="help-video__mobile-hint">
                            {isLocalDev ? 'Disponible en la versión publicada' : 'Se abrirá en YouTube'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* En producción: iframe funciona en PC y mobile */
                      <iframe
                        className="help-video__iframe"
                        src={getEmbedUrl(videoUrl)}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onError={() => setIframeBlocked(true)}
                      />
                    )}
                  </>
                ) : (
                  <div className="help-video__empty">Video no configurado</div>
                )}
              </div>
            )}

            {isSuperAdmin && (
              <div className="help-video__admin">
                {editing ? (
                  <div className="help-video__edit">
                    <input
                      className="help-video__input"
                      value={draftUrl}
                      onChange={e => setDraftUrl(e.target.value)}
                      placeholder="Pega el link de YouTube aquí..."
                    />
                    <button className="help-video__save-btn" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader size={16} className="spinner"/> : <Check size={16} />}
                    </button>
                  </div>
                ) : (
                  <button className="help-video__admin-btn" onClick={() => { setDraftUrl(videoUrl); setEditing(true) }}>
                    <Edit2 size={14} /> Editar Link (Admin)
                  </button>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
