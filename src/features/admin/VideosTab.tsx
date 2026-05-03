/* ============================================================
   VideosTab.tsx — Gestión de todos los videos de ayuda
   Solo visible para super-admin en /admin.
   Lista todos los registros de help_videos y permite editar
   el link de YouTube de cada uno directamente.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect, useCallback } from 'react'
import { Link2, Check, Loader, Video } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { showToast } from '../../components/ui/Toast'
import './VideosTab.css'

type HelpVideo = {
  section_key: string
  title: string
  video_url: string
}

const SECTION_LABELS: Record<string, string> = {
  onboarding_welcome: 'Tutorial de bienvenida (primera vez)',
  routines_list:      'Rutinas — Lista de rutinas',
  routine_detail:     'Rutinas — Detalle y edicion',
  session_start:      'Sesion — Inicio de entrenamiento',
  exercises_catalog:  'Catalogo de ejercicios',
  dashboard:          'Inicio / Dashboard',
  settings:           'Configuracion',
}

export function VideosTab() {
  const [videos,  setVideos]  = useState<HelpVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts,  setDrafts]  = useState<Record<string, string>>({})
  const [saving,  setSaving]  = useState<string | null>(null)

  const loadVideos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('help_videos')
      .select('section_key, title, video_url')
      .order('section_key', { ascending: true })

    if (error) showToast('Error al cargar videos', 'error')
    else {
      const rows = (data ?? []) as HelpVideo[]
      setVideos(rows)
      const initial: Record<string, string> = {}
      rows.forEach((v) => { initial[v.section_key] = v.video_url })
      setDrafts(initial)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadVideos() }, [loadVideos])

  async function handleSave(sectionKey: string, currentTitle: string) {
    const url = (drafts[sectionKey] ?? '').trim()
    setSaving(sectionKey)

    const { error } = await supabase
      .from('help_videos')
      .upsert(
        { section_key: sectionKey, video_url: url, title: currentTitle, updated_at: new Date().toISOString() },
        { onConflict: 'section_key' },
      )

    if (error) {
      showToast('Error al guardar', 'error')
    } else {
      showToast('Video actualizado', 'success')
      setVideos((prev) =>
        prev.map((v) => v.section_key === sectionKey ? { ...v, video_url: url } : v)
      )
    }
    setSaving(null)
  }

  const allKeys = Object.keys(SECTION_LABELS)
  // Incluye secciones conocidas aunque no tengan fila en BD todavía
  const mergedKeys = Array.from(new Set([...allKeys, ...videos.map((v) => v.section_key)]))

  return (
    <div className="videos-tab">
      <p className="videos-tab__hint">
        Pega el link de YouTube de cada seccion. Los usuarios ven el boton "?" en cada pantalla.
        El tutorial de bienvenida se muestra automaticamente la primera vez que alguien abre la app.
      </p>

      {loading && (
        <div className="videos-tab__loading">
          <Loader size={20} className="spinner" />
          <span>Cargando...</span>
        </div>
      )}

      {!loading && (
        <div className="videos-tab__list">
          {mergedKeys.map((key) => {
            const row = videos.find((v) => v.section_key === key)
            const label = SECTION_LABELS[key] ?? key
            const isOnboarding = key === 'onboarding_welcome'
            return (
              <div key={key} className={`videos-tab__item${isOnboarding ? ' videos-tab__item--featured' : ''}`}>
                <div className="videos-tab__item-header">
                  <Video size={14} className="videos-tab__icon" />
                  <span className="videos-tab__label">{label}</span>
                  {isOnboarding && <span className="videos-tab__badge">Bienvenida</span>}
                </div>
                <div className="videos-tab__input-row">
                  <Link2 size={14} className="videos-tab__link-icon" />
                  <input
                    className="videos-tab__input"
                    type="text"
                    placeholder="https://youtu.be/..."
                    value={drafts[key] ?? row?.video_url ?? ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(key, row?.title ?? label) }}
                  />
                  <button
                    className="videos-tab__save-btn"
                    onClick={() => void handleSave(key, row?.title ?? label)}
                    disabled={saving === key}
                    aria-label="Guardar link"
                  >
                    {saving === key ? <Loader size={14} className="spinner" /> : <Check size={14} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
