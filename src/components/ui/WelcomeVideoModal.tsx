/* ============================================================
   WelcomeVideoModal.tsx — Tutorial de bienvenida (primera vez)
   Standalone — carga help_videos con section_key='onboarding_welcome'.
   Se muestra una vez por dispositivo/navegador via localStorage.
   Si el usuario borra cache vuelve a aparecer.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, PlayCircle, ExternalLink, Loader, Edit2, Check } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../stores/authStore'
import { showToast } from './Toast'
import './WelcomeVideoModal.css'

const WELCOME_SEEN_KEY  = 'gym_welcome_seen_v1'
const SECTION_KEY       = 'onboarding_welcome'
const SUPER_ADMIN_ID    = import.meta.env.VITE_SUPER_ADMIN_ID as string ?? ''

const isLocalDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   /^192\.168\./.test(window.location.hostname))

function getVideoId(raw: string): string | null {
  if (!raw) return null
  let url = raw.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  try {
    const p = new URL(url)
    if (p.hostname.includes('youtube.com')) {
      if (p.pathname.includes('/watch'))   return p.searchParams.get('v')
      if (p.pathname.includes('/shorts/')) return p.pathname.split('/shorts/')[1].split('?')[0]
    }
    if (p.hostname.includes('youtu.be')) return p.pathname.substring(1).split('?')[0]
  } catch { /* ignorar */ }
  return null
}

type WelcomeVideoModalProps = { onClose: () => void }

export function WelcomeVideoModal({ onClose }: WelcomeVideoModalProps) {
  const userId       = useAuthStore((s) => s.user?.id)
  const isSuperAdmin = userId === SUPER_ADMIN_ID

  const [videoUrl,  setVideoUrl]  = useState('')
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState(false)
  const [draftUrl,  setDraftUrl]  = useState('')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    supabase
      .from('help_videos')
      .select('video_url')
      .eq('section_key', SECTION_KEY)
      .maybeSingle()
      .then(({ data }) => {
        setVideoUrl((data as { video_url: string } | null)?.video_url ?? '')
        setLoading(false)
      })
  }, [])

  function handleClose() {
    localStorage.setItem(WELCOME_SEEN_KEY, '1')
    onClose()
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('help_videos').upsert(
      { section_key: SECTION_KEY, video_url: draftUrl.trim(), title: 'Tutorial de bienvenida', updated_at: new Date().toISOString() },
      { onConflict: 'section_key' },
    )
    if (error) showToast('Error al guardar', 'error')
    else { showToast('Video actualizado', 'success'); setVideoUrl(draftUrl.trim()); setEditing(false) }
    setSaving(false)
  }

  const videoId   = getVideoId(videoUrl)
  const embedUrl  = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1` : ''
  const directUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl
  const thumbUrl  = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''

  const content = (
    <div className="wv-overlay" onClick={handleClose}>
      <div className="wv-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="wv-modal__header">
          <span className="wv-modal__badge">Tutorial de inicio</span>
          <button className="wv-modal__close" onClick={handleClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="wv-modal__body">
          {loading ? (
            <div className="wv-modal__loading"><Loader size={24} className="spinner" /></div>
          ) : !videoUrl && !isSuperAdmin ? (
            <p className="wv-modal__empty">El tutorial de bienvenida no esta disponible aun.</p>
          ) : (
            <div className="wv-modal__frame-wrap">
              {videoUrl ? (
                isLocalDev ? (
                  <div className="wv-modal__fallback">
                    {thumbUrl && <img className="wv-modal__thumb" src={thumbUrl} alt="Tutorial" />}
                    <a className="wv-modal__yt-btn" href={directUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle size={26} />
                      <span>Ver tutorial en YouTube</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ) : (
                  <iframe
                    className="wv-modal__iframe"
                    src={embedUrl}
                    title="Tutorial de bienvenida"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                <p className="wv-modal__empty">Video no configurado aun.</p>
              )}
            </div>
          )}

          {/* Edicion solo para super-admin */}
          {isSuperAdmin && (
            <div className="wv-modal__admin">
              {editing ? (
                <div className="wv-modal__edit-row">
                  <input
                    className="wv-modal__input"
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    placeholder="Pega el link de YouTube aqui..."
                  />
                  <button className="wv-modal__save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader size={14} className="spinner" /> : <Check size={14} />}
                  </button>
                </div>
              ) : (
                <button className="wv-modal__edit-btn" onClick={() => { setDraftUrl(videoUrl); setEditing(true) }}>
                  <Edit2 size={13} /> Editar link (Admin)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

/** Verifica si el usuario ya vio el tutorial en este dispositivo/navegador */
export function hasSeenWelcome(): boolean {
  try { return localStorage.getItem(WELCOME_SEEN_KEY) === '1' } catch { return false }
}
