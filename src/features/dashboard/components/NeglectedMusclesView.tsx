/* ============================================================
   NeglectedMusclesView.tsx — Mapa corporal de músculos olvidados
   GYM-YJMG — Modelo 2 (muscle_thresholds_config.json)

   Músculos descuidados → intensidad 8 (naranja vía CSS)
   Músculos al día (calibrados) → intensidad 1 (verde vía CSS)
   Sin datos → sin pintar (gris default del SVG)

   API BodyChart igual que RecoveryBodyMap:
   init → new BodyChart(el, options)
   update → chartRef.current.update({ view, bodyState })
   ============================================================ */
import { useRef, useEffect, useState } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { BodyState } from 'body-muscles'
import { useNeglectedMuscles } from '../hooks/useNeglectedMuscles'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { AIInfoBadge } from '../../../components/ui/AIInfoBadge'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import './NeglectedMusclesView.css'

/* ── Mapeo grupo muscular → IDs de body-muscles ─────────────── */

const GROUP_MAPPING: Record<string, string[]> = {
  chest:      ['chest-upper-left','chest-upper-right','chest-lower-left','chest-lower-right'],
  upper_back: ['lats-upper-left','lats-mid-left','lats-lower-left','lats-upper-right','lats-mid-right','lats-lower-right','spine'],
  lower_back: ['lower-back-erectors-left','lower-back-ql-left','lower-back-erectors-right','lower-back-ql-right'],
  deltoids:   ['shoulder-front-left','shoulder-front-right','shoulder-side-left','shoulder-side-right','deltoid-rear-left','deltoid-rear-right'],
  biceps:     ['biceps-left','biceps-right'],
  triceps:    ['triceps-long-left','triceps-lateral-left','triceps-long-right','triceps-lateral-right'],
  quadriceps: ['quads-left','quads-right','adductors-left','adductors-right','hip-flexor-left','hip-flexor-right'],
}

// Solo los 7 grupos con calibración confiable (≥30 sesiones, threshold ≤45d)
const CALIBRATED_GROUPS = Object.keys(GROUP_MAPPING)

function buildBodyState(neglectedSet: Set<string>): BodyState {
  const state: BodyState = {}
  for (const [group, ids] of Object.entries(GROUP_MAPPING)) {
    // intensity 8 → naranja (descuidado) | intensity 1 → verde (al día)
    const intensity = neglectedSet.has(group) ? 8 : 1
    for (const id of ids) {
      state[id] = { selected: true, intensity }
    }
  }
  return state
}

/* ── Componente ──────────────────────────────────────────────── */

export function NeglectedMusclesView() {
  const { neglected, loading } = useNeglectedMuscles()
  const [view, setView] = useState<'front' | 'back'>('front')
  const containerRef    = useRef<HTMLDivElement>(null)
  const chartRef        = useRef<BodyChart | null>(null)

  const neglectedSet = new Set(neglected.map(m => m.muscle_group))

  /* Inicializar / destruir cuando cambian los datos (igual que RecoveryBodyMap) */
  useEffect(() => {
    if (!containerRef.current || loading) return

    const bodyState = buildBodyState(neglectedSet)

    chartRef.current = new BodyChart(containerRef.current, {
      view:               view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState,
      enableTransitions:  true,
      showViewLabel:      false,
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Actualizar cuando cambia la vista o los datos */
  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.update({
      view:      view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState: buildBodyState(neglectedSet),
    })
  }, [view, neglected]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="neglected-view neglected-view--loading">
        <HamsterLoader size={48} />
      </div>
    )
  }

  return (
    <div className="neglected-view">

      {/* Header */}
      <div className="neglected-view__header">
        <div className="neglected-view__title-row">
          <h3 className="neglected-view__title">Músculos Olvidados</h3>
          <AIInfoBadge title="¿Cómo funciona este algoritmo?">
            <p>Detecta músculos que llevan más días <em>sin entrenarse</em> que su umbral estadístico.</p>
            <p>Los umbrales se calcularon del <strong>percentil P75</strong> de los intervalos de descanso en el dataset <strong>joep89/weightlifting</strong> (721 sesiones reales).</p>
            <p><strong>Naranja</strong> = descuidado · <strong>Verde</strong> = al día · <strong>Gris</strong> = sin datos suficientes.</p>
            <p>Solo se muestran los <strong>7 grupos musculares</strong> con calibración estadísticamente confiable (≥30 sesiones, umbral ≤45 días).</p>
          </AIInfoBadge>
        </div>

        {/* Toggle frontal / posterior */}
        <div className="neglected-view__view-toggle">
          <button
            className={`neglected-view__view-btn ${view === 'front' ? 'neglected-view__view-btn--active' : ''}`}
            onClick={() => setView('front')}
          >
            Frontal
          </button>
          <button
            className={`neglected-view__view-btn ${view === 'back' ? 'neglected-view__view-btn--active' : ''}`}
            onClick={() => setView('back')}
          >
            Posterior
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="neglected-view__legend">
        <span className="neglected-view__legend-item">
          <span className="neglected-view__legend-dot neglected-view__legend-dot--warn" />
          Descuidado
        </span>
        <span className="neglected-view__legend-item">
          <span className="neglected-view__legend-dot neglected-view__legend-dot--ok" />
          Al día
        </span>
        <span className="neglected-view__legend-item">
          <span className="neglected-view__legend-dot neglected-view__legend-dot--nd" />
          Sin datos
        </span>
      </div>

      {/* Mapa corporal */}
      <div className="neglected-view__canvas">
        <div ref={containerRef} className="svg-wrapper" />
      </div>

      {/* Lista de resultados */}
      {neglected.length === 0 ? (
        <div className="neglected-view__all-ok">
          <CheckCircle size={20} className="neglected-view__all-ok-icon" />
          <p>Todos tus músculos calibrados están al día. ¡Sigue así!</p>
        </div>
      ) : (
        <div className="neglected-view__list">
          <p className="neglected-view__list-label">
            <AlertTriangle size={13} />
            {neglected.length} músculo{neglected.length > 1 ? 's' : ''} sin entrenar:
          </p>
          {neglected.map(m => (
            <div key={m.muscle_group} className="neglected-view__item">
              <span className="neglected-view__item-label">{m.label}</span>
              <span className="neglected-view__item-days">
                {m.days_since >= 90 ? '+90' : m.days_since}d
                <span className="neglected-view__item-threshold">
                  &nbsp;/ umbral {m.neglect_threshold}d
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
