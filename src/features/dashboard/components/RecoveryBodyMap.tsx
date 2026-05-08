import { useRef, useEffect, useState } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { BodyState } from 'body-muscles'
import { useMuscleRecovery } from '../hooks/useMuscleRecovery'
import type { MuscleState } from '../hooks/useMuscleRecovery'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
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

function getStateLabel(state: MuscleState): string {
  switch (state) {
    case 'exhausted': return 'Exhausto (Requiere ~48h)'
    case 'recovering': return 'En recuperación (Requiere ~24h)'
    case 'recovered': return 'Recuperado (Listo para entrenar)'
  }
}

function getStateColor(state: MuscleState): string {
  switch (state) {
    case 'exhausted': return 'var(--color-danger)'
    case 'recovering': return 'var(--color-warning)'
    case 'recovered': return 'var(--color-success)'
  }
}

function getIntensityFromState(state: MuscleState): number {
  switch (state) {
    case 'exhausted': return 9
    case 'recovering': return 5
    case 'recovered': return 2
  }
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
        const intensity = getIntensityFromState(data.state)
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
                <p><strong style={{ color: getStateColor(selectedData.state) }}>{getStateLabel(selectedData.state)}</strong></p>
                <p>Último: {selectedData.last_worked}</p>
                <p>Series (7d): {selectedData.sets_done}</p>
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
