/* ============================================================
   BonusTrackPicker.tsx — Modal de selección de ejercicio ad-hoc durante sesión
   FASE 05.5 fix 2 — GYM-YJMG
   BodyMap colapsable (como AddExerciseSheet), scroll correcto.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useMemo } from 'react'
import { Search, X, Plus, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { Button } from '../../../components/ui/Button'
import { BodyMap, BODY_MUSCLE_SEARCH } from '../../routines/components/BodyMap'
import type { BodyMuscle } from '../../routines/components/BodyMap'
import { useExerciseSearch } from '../../routines/hooks/useExerciseSearch'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import { toSpanishMuscle } from '../../../utils/muscleGroupLabels'
import './BonusTrackPicker.css'

type BonusTrackPickerProps = {
  onConfirm: (exerciseId: string, exerciseName: string, targetSets: number) => void
  onClose: () => void
}

const DEFAULT_SETS = 3
const SET_OPTIONS = [1, 2, 3, 4, 5]

export function BonusTrackPicker({ onConfirm, onClose }: BonusTrackPickerProps) {
  const { allResults, query, loading, setQuery } = useExerciseSearch()
  const [selected, setSelected] = useState<ExerciseCatalogRow | null>(null)
  const [targetSets, setTargetSets] = useState(DEFAULT_SETS)
  const [activeMuscle, setActiveMuscle] = useState<BodyMuscle | null>(null)
  const [bodyMapOpen, setBodyMapOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!activeMuscle) return allResults.slice(0, 30)
    const terms = BODY_MUSCLE_SEARCH[activeMuscle] ?? []
    return allResults
      .filter((ex) => terms.some((t) => (ex.muscle_group?.toLowerCase() ?? '').includes(t)))
      .slice(0, 30)
  }, [allResults, activeMuscle])

  function handleMuscleSelect(m: BodyMuscle | null) {
    setActiveMuscle((prev) => (prev === m ? null : m))
    // Colapsar el mapa al seleccionar músculo para liberar espacio a la lista
    if (m !== null) setBodyMapOpen(false)
  }

  function handleConfirm() {
    if (!selected) return
    onConfirm(selected.id, selected.name, targetSets)
  }

  return (
    <div className="bonus-picker__overlay" onClick={onClose}>
      <div className="bonus-picker" onClick={(e) => e.stopPropagation()}>
        <div className="bonus-picker__header">
          <h2 className="bonus-picker__title">Agregar ejercicio</h2>
          <button className="bonus-picker__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Toggle del BodyMap */}
        <button
          className={`bonus-picker__map-toggle ${activeMuscle ? 'bonus-picker__map-toggle--active' : ''}`}
          onClick={() => setBodyMapOpen((v) => !v)}
          type="button"
        >
          <span>
            {activeMuscle ? `Músculo: ${activeMuscle}` : 'Filtrar por músculo'}
          </span>
          {activeMuscle && (
            <button
              className="bonus-picker__map-clear"
              onClick={(e) => { e.stopPropagation(); setActiveMuscle(null) }}
              type="button"
              aria-label="Quitar filtro"
            >
              <X size={12} />
            </button>
          )}
          {bodyMapOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* BodyMap colapsable */}
        {bodyMapOpen && (
          <div className="bonus-picker__body-map">
            <BodyMap selected={activeMuscle} onSelect={handleMuscleSelect} />
          </div>
        )}

        {/* Buscador */}
        <div className="bonus-picker__search">
          <Search size={16} className="bonus-picker__search-icon" />
          <input
            className="bonus-picker__search-input"
            placeholder={activeMuscle ? `Buscar en ${activeMuscle}...` : 'Buscar ejercicio...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Lista — scrollable, flex: 1 */}
        <div className="bonus-picker__list">
          {loading && <div className="bonus-picker__loading"><HamsterLoader size={60} /></div>}

          {!loading && filtered.map((ex) => (
            <button
              key={ex.id}
              className={`bonus-picker__item ${selected?.id === ex.id ? 'bonus-picker__item--selected' : ''}`}
              onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
            >
              <div className="bonus-picker__item-icon">
                {ex.image_url
                  ? <img src={ex.image_url} alt={ex.name} className="bonus-picker__item-img" loading="lazy" />
                  : <Dumbbell size={18} />
                }
              </div>
              <div className="bonus-picker__item-info">
                <span className="bonus-picker__item-name">{ex.name}</span>
                <span className="bonus-picker__item-muscle">{toSpanishMuscle(ex.muscle_group)}</span>
              </div>
            </button>
          ))}

          {!loading && filtered.length === 0 && (
            <p className="bonus-picker__empty">Sin resultados</p>
          )}
        </div>

        {/* Configuración de sets */}
        {selected && (
          <div className="bonus-picker__config">
            <p className="bonus-picker__config-label">Sets objetivo</p>
            <div className="bonus-picker__sets">
              {SET_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={`bonus-picker__set-btn ${targetSets === n ? 'bonus-picker__set-btn--active' : ''}`}
                  onClick={() => setTargetSets(n)}
                >{n}</button>
              ))}
            </div>
            <Button variant="primary" size="md" fullWidth onClick={handleConfirm}>
              <Plus size={16} />
              Agregar {selected.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
