/* ============================================================
   BodyMap.tsx — Mapa muscular interactivo
   Integración premium con 'body-muscles' (FASE 05)
   Responsabilidad: Renderizar anatomía y emitir selecciones.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useRef, useEffect, useState } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { BodyState } from 'body-muscles'
import { Zap, Waves } from 'lucide-react'
import './BodyMap.css'

export type BodyMuscle = string

type BodyMapProps = {
  selected: BodyMuscle | null
  onSelect: (muscle: BodyMuscle | null) => void
}

/** 
 * Términos de búsqueda por músculo.
 * Mapea los IDs en inglés de body-muscles a términos de búsqueda en nuestra DB.
 */
export const BODY_MUSCLE_SEARCH: Record<string, string[]> = {
  chest: ['chest', 'pecho'],
  upper_back: ['back', 'espalda', 'lats'],
  lower_back: ['back', 'espalda', 'cadena posterior'],
  trapezius: ['traps', 'trapezius', 'espalda', 'back'],
  deltoids: ['shoulders', 'hombros', 'hombro'],
  biceps: ['biceps', 'bicep', 'brachialis', 'arms'],
  triceps: ['triceps', 'tricep', 'arms'],
  abdominals: ['abs', 'abdomen', 'abdominales', 'core'],
  obliques: ['obliques', 'obliquus externus abdominis', 'abdomen', 'abs'],
  quadriceps: ['legs', 'piernas', 'pierna', 'quads', 'cuerpo completo', 'todos'],
  hamstrings: ['legs', 'piernas', 'pierna', 'hamstrings', 'cadena posterior'],
  gluteals: ['glutes', 'gluteos'],
  calves: ['calves', 'pantorrilla', 'soleus'],
  forearms: ['forearms', 'antebrazos', 'arms'],
  neck: ['cuello', 'neck'],
  // Cardio: no es un músculo del mapa pero se incluye como filtro especial
  cardio: ['cardio', 'cardiovascular', 'hiit', 'aerobic'],
  // Estiramiento: categoría funcional, no anatómica
  estiramiento: ['estiramiento', 'stretching', 'stretch', 'flexibility', 'movilidad', 'mobility'],
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

export function BodyMap({ selected, onSelect }: BodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  // body-muscles requiere un objeto BodyState con los IDs exactos (ej. chest-upper-left).
  // Mapeamos nuestro 'selected' (ej. 'chest') a todos los fragmentos correspondientes.
  const bodyState: BodyState = {}
  if (selected && GROUP_MAPPING[selected]) {
    GROUP_MAPPING[selected].forEach((id) => {
      bodyState[id] = { selected: true, intensity: 8 }
    })
  } else if (hoveredName) {
    // Iluminar suavemente al hacer hover
    const hoverGroup = getBaseGroup(hoveredName)
    if (hoverGroup && GROUP_MAPPING[hoverGroup]) {
      GROUP_MAPPING[hoverGroup].forEach((id) => {
        if (!bodyState[id]) bodyState[id] = { selected: false, intensity: 3 }
      })
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Instanciar la librería anatómica
    chartRef.current = new BodyChart(containerRef.current, {
      view: view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState,
      onMuscleClick: (id) => {
        // Obtenemos el grupo base (ej. 'chest') a partir del id específico (ej. 'chest-upper-left')
        const group = getBaseGroup(id)
        if (group) {
          onSelect(selected === group ? null : group)
        }
      },
      onMuscleHover: (id) => {
        setHoveredName(id || null)
      },
      enableTransitions: true, // Fade animado al girar
      showViewLabel: false,
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Si la vista o la selección cambia desde fuera (o desde los botones), actualizamos el canvas
    if (chartRef.current) {
      chartRef.current.update({
        view: view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
        bodyState,
      })
    }
  }, [view, selected, hoveredName])

  // Obtener el nombre para mostrar basado en el hover o el seleccionado
  const displayGroup = hoveredName ? getBaseGroup(hoveredName) : selected
  const displayLabel = displayGroup ? MUSCLE_NAMES[displayGroup] : ''

  const isCardio = selected === 'cardio'
  const isEstiramiento = selected === 'estiramiento'

  return (
    <div className="body-map">
      <div className="body-map__top-row">
        {/* Toggle Frente / Espalda */}
        <div className="body-map__toggle">
          <button
            type="button"
            className={`body-map__toggle-btn ${view === 'front' ? 'body-map__toggle-btn--active' : ''}`}
            onClick={() => { setView('front'); if (isCardio || isEstiramiento) onSelect(null) }}
          >
            Frente
          </button>
          <button
            type="button"
            className={`body-map__toggle-btn ${view === 'back' ? 'body-map__toggle-btn--active' : ''}`}
            onClick={() => { setView('back'); if (isCardio || isEstiramiento) onSelect(null) }}
          >
            Espalda
          </button>
        </div>

        {/* Botones flotantes: Cardio y Estiramiento */}
        <div className="body-map__special-btns">
          <button
            type="button"
            className={`body-map__cardio-btn ${isCardio ? 'body-map__cardio-btn--active' : ''}`}
            onClick={() => onSelect(isCardio ? null : 'cardio')}
            title="Filtrar ejercicios de cardio"
          >
            <Zap size={13} />
            Cardio
          </button>
          <button
            type="button"
            className={`body-map__stretch-btn ${isEstiramiento ? 'body-map__stretch-btn--active' : ''}`}
            onClick={() => onSelect(isEstiramiento ? null : 'estiramiento')}
            title="Filtrar ejercicios de estiramiento"
          >
            <Waves size={13} />
            Estirar
          </button>
        </div>
      </div>

      {/* Mapa anatómico — se opaca al seleccionar categorías especiales */}
      <div className={`body-map__canvas ${(isCardio || isEstiramiento) ? 'body-map__canvas--dimmed' : ''}`}>
        <div ref={containerRef} className="svg-wrapper" />
        <p className="body-map__selected-label">
          {isCardio ? 'Cardio / Aeróbico' : isEstiramiento ? 'Estiramiento / Movilidad' : displayLabel}
        </p>
      </div>
    </div>
  )
}
