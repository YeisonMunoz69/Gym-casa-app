import { useRef, useEffect, useState } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { BodyState } from 'body-muscles'
import { useMuscleRecovery } from '../hooks/useMuscleRecovery'
import type { MuscleState } from '../hooks/useMuscleRecovery'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { AIInfoBadge } from '../../../components/ui/AIInfoBadge'
import { Dumbbell } from 'lucide-react'
import './RecoveryBodyMap.css'

const GROUP_MAPPING: Record<string, string[]> = {
  chest: ["chest-upper-left", "chest-upper-right", "chest-lower-left", "chest-lower-right"],
  upper_back: ["lats-upper-left", "lats-mid-left", "lats-lower-left", "lats-upper-right", "lats-mid-right", "lats-lower-right", "spine"],
  lower_back: ["lower-back-erectors-left", "lower-back-ql-left", "lower-back-erectors-right", "lower-back-ql-right"],
  trapezius: ["traps-upper-left", "traps-mid-left", "traps-lower-left", "traps-upper-right", "traps-mid-right", "traps-lower-right"],
  deltoids: ["shoulder-front-left", "shoulder-front-right", "shoulder-side-left", "shoulder-side-right", "deltoid-rear-left", "deltoid-rear-right"],
  biceps: ["biceps-left", "biceps-right"],
  triceps: ["triceps-long-left", "triceps-lateral-left", "triceps-long-right", "triceps-lateral-right"],
  abdominals: ["abs-upper-left", "abs-upper-right", "abs-lower-left", "abs-lower-right", "serratus-anterior-left", "serratus-anterior-right"],
  obliques: ["obliques-left", "obliques-right"],
  quadriceps: ["quads-left", "quads-right", "adductors-left", "adductors-right", "hip-flexor-left", "hip-flexor-right"],
  hamstrings: ["hamstrings-medial-left", "hamstrings-lateral-left", "hamstrings-medial-right", "hamstrings-lateral-right"],
  gluteals: ["gluteus-medius-left", "gluteus-maximus-left", "gluteus-medius-right", "gluteus-maximus-right"],
  calves: ["calves-gastroc-medial-left", "calves-gastroc-lateral-left", "calves-soleus-left", "calves-gastroc-medial-right", "calves-gastroc-lateral-right", "calves-soleus-right", "tibialis-anterior-left", "tibialis-anterior-right"],
  forearms: ["forearm-left", "forearm-right", "forearm-flexors-left", "forearm-extensors-left", "forearm-flexors-right", "forearm-extensors-right"],
  neck: ["head", "face", "neck-right", "neck-left", "head-back", "nape"],
}

function getBaseGroup(id: string): string | null {
  for (const [group, ids] of Object.entries(GROUP_MAPPING)) {
    if (ids.includes(id)) return group;
  }
  return null;
}

const MUSCLE_NAMES: Record<string, string> = {
  chest: 'Pecho',
  upper_back: 'Espalda Alta',
  lower_back: 'Lumbar',
  trapezius: 'Trapecio',
  deltoids: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdominals: 'Abdomen',
  obliques: 'Oblicuos',
  quadriceps: 'Cuádriceps',
  hamstrings: 'Femorales',
  gluteals: 'Glúteos',
  calves: 'Pantorrillas',
  forearms: 'Antebrazos',
  neck: 'Cuello',
}

function getStateLabel(state: MuscleState, score?: number): string {
  switch (state) {
    case 'exhausted':
      return score != null
        ? `Exhausto — fatiga ${score}/100`
        : 'Exhausto (Requiere ~48h)'
    case 'recovering':
      return score != null
        ? `Recuperando — fatiga ${score}/100`
        : 'En recuperaci\u00f3n (Requiere ~24h)'
    case 'recovered':
      return score != null
        ? `Recuperado — fatiga ${score}/100`
        : 'Recuperado (Listo para entrenar)'
  }
}

function getStateColor(state: MuscleState): string {
  switch (state) {
    case 'exhausted':  return 'var(--color-danger)'
    case 'recovering': return 'var(--color-warning)'
    case 'recovered':  return 'var(--color-success)'
  }
}

/**
 * Convierte el estado y score a la intensidad 0-10 que usa
 * la librería body-muscles para colorear el SVG (amarillo -> rojo).
 * Si está recuperado, retorna 0 para usar el estilo verde base (CSS).
 */
function getIntensityFromState(state: MuscleState, score: number): number {
  if (state === 'recovered') return 0; // Verde suave base (sin color inline)
  
  if (state === 'recovering') {
    // Rango aprox de recovering: 9.2 a 39.3 -> Mapear a intensidad 1 a 6 (amarillo a naranja)
    const p = Math.max(0, Math.min(1, (score - 9.2) / (39.3 - 9.2)));
    return Math.round(1 + p * 5);
  }
  
  // exhausted
  // Rango exhausted: 39.3 a 100 -> Mapear a intensidad 7 a 10 (rojo a rojo oscuro)
  const p = Math.max(0, Math.min(1, (score - 39.3) / (100 - 39.3)));
  return Math.round(7 + p * 3);
}

export function RecoveryBodyMap() {
  const { recoveryData, loading } = useMuscleRecovery()
  const [view, setView] = useState<'front' | 'back'>('front')
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null)

  const bodyState: BodyState = {}
  
  if (!loading) {
    for (const [group, data] of Object.entries(recoveryData)) {
      if (GROUP_MAPPING[group]) {
        // v2.0: intensidad mapeada exactamente al estado semántico
        const intensity = getIntensityFromState(data.state, data.score ?? 0)
        GROUP_MAPPING[group].forEach(id => {
          bodyState[id] = { selected: true, intensity }
        })
      }
    }
  }

  useEffect(() => {
    if (!containerRef.current || loading) return

    chartRef.current = new BodyChart(containerRef.current, {
      view: view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState,
      onMuscleClick: (id) => {
        const group = getBaseGroup(id)
        if (group) setSelectedMuscle(group)
      },
      onMuscleHover: (id) => {
        const group = id ? getBaseGroup(id) : null
        setSelectedMuscle(group)
        if (!group) setTooltipPos(null)
      },
      enableTransitions: true,
      showViewLabel: false,
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [loading])

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update({
        view: view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
        bodyState,
      })
    }
  }, [view, recoveryData])

  if (loading) {
    return (
      <div className="recovery-map__loading">
        <HamsterLoader size={60} />
      </div>
    )
  }

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = containerRef.current.getBoundingClientRect()
    setTooltipPos({ x: clientX - rect.left, y: clientY - rect.top })
  }

  const selectedData = selectedMuscle ? recoveryData[selectedMuscle] : null
  const hasData = Object.keys(recoveryData).length > 0

  return (
    <div className="recovery-map">
      <div className="recovery-map__header">
        <h3 className="recovery-map__title">Estado de Recuperación</h3>
        <AIInfoBadge title="¿Cómo funciona el mapa de recuperación?">
          <p>El mapa colorea cada músculo según su nivel de <strong>fatiga acumulada</strong> en los últimos 14 días.</p>
          <p>Usa el <strong>Modelo ATL de Banister</strong> (Acute Training Load), un estándar científico en periodización deportiva:</p>
          <p style={{fontFamily: 'monospace', fontSize: '0.85em', background: 'var(--glass-bg-strong)', padding: '8px', borderRadius: '6px'}}>
            Fatiga = Σ volumen × e^(-días / tau)
          </p>
          <p>Donde <em>tau</em> es la constante de recuperación calibrada por músculo (grupos rápidos como bíceps: ~2-3 días, grupos lentos como piernas: ~3-4 días).</p>
          <p><strong>Estados:</strong></p>
          <ul style={{paddingLeft: '1.2em', margin: '0.5em 0'}}>
            <li><strong style={{color: 'var(--color-danger)'}}>Exhausto</strong> — Fatiga alta, necesita descanso</li>
            <li><strong style={{color: 'var(--color-warning)'}}>Recuperando</strong> — Fatiga media, puede entrenar con moderación</li>
            <li><strong style={{color: 'var(--color-success)'}}>Recuperado</strong> — Listo para entrenar al 100%</li>
          </ul>
          <p>Toca cualquier músculo del mapa para ver su score de fatiga exacto.</p>
        </AIInfoBadge>
        <div className="body-map__toggle">
          <button
            type="button"
            className={`body-map__toggle-btn ${view === 'front' ? 'body-map__toggle-btn--active' : ''}`}
            onClick={() => setView('front')}
          >
            Frente
          </button>
          <button
            type="button"
            className={`body-map__toggle-btn ${view === 'back' ? 'body-map__toggle-btn--active' : ''}`}
            onClick={() => setView('back')}
          >
            Espalda
          </button>
        </div>
      </div>

      <div className="recovery-map__legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-danger)' }}></span> Exhausto</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-warning)' }}></span> Recuperando</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-success)' }}></span> Recuperado</span>
      </div>

      {!hasData && (
        <p className="recovery-map__empty">Registra entrenamientos para ver tu estado muscular.</p>
      )}

      <div 
        className="recovery-map__canvas"
        onMouseMove={handleInteraction}
        onClick={handleInteraction}
      >
        <div ref={containerRef} className="svg-wrapper" />
        
        {selectedMuscle && tooltipPos && (
          <div 
            className="recovery-tooltip"
            style={{ 
              left: Math.min(tooltipPos.x, (containerRef.current?.offsetWidth || 300) - 180),
              top: Math.max(0, tooltipPos.y - 120)
            }}
          >
            <div className="recovery-info__header">
              <Dumbbell size={14} />
              <h4>{MUSCLE_NAMES[selectedMuscle] || selectedMuscle}</h4>
            </div>
            {selectedData ? (
              <div className="recovery-info__details">
                <p><strong style={{ color: getStateColor(selectedData.state) }}>
                  {getStateLabel(selectedData.state, selectedData.score)}
                </strong></p>
                {/* Barra de progreso del score (0-100) */}
                <div className="recovery-info__score-bar">
                  <div
                    className="recovery-info__score-fill"
                    style={{
                      width: `${selectedData.score ?? 0}%`,
                      background: getStateColor(selectedData.state),
                    }}
                  />
                </div>
                <p>\u00daltimo: {selectedData.last_worked}</p>
                <p>Series (14d): {selectedData.sets_done}</p>
              </div>
            ) : (
              <div className="recovery-info__details">
                <p><strong style={{ color: 'var(--color-success)' }}>Recuperado</strong></p>
                <p>Sin fatiga reciente.</p>
              </div>
            )}
          </div>
        )}
    </div>
  </div>
  )
}
