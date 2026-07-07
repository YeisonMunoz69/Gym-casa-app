import { useState, useMemo } from 'react'
import { X, Search, Dumbbell, Plus, ChevronDown, PersonStanding, PenLine } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { useExerciseSearch } from '../hooks/useExerciseSearch'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { BodyMap } from './BodyMap'
import { CreateExerciseForm } from './CreateExerciseForm'
import type { BodyMuscle } from './BodyMap'
import { BODY_MUSCLE_SEARCH } from './BodyMap'
import type { ExerciseCatalogRow } from '../../../types/exercise'
import { toSpanishMuscle, MUSCLE_GROUP_FILTERS } from '../../../utils/muscleGroupLabels'
import './AddExerciseSheet.css'

const PAGE_SIZE = 30

/** Grupos musculares con valores en espanol e ingles para filtros */
const MUSCLE_GROUPS = MUSCLE_GROUP_FILTERS

type AddExerciseSheetProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (exercise: ExerciseCatalogRow) => void
  onPreview?: (exercise: ExerciseCatalogRow) => void
}

export function AddExerciseSheet({ isOpen, onClose, onAdd, onPreview }: AddExerciseSheetProps) {
  const { allResults, query, loading, setQuery } = useExerciseSearch()
  const [muscleFilter, setMuscleFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showBodyMap, setShowBodyMap] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [bodyMapMuscle, setBodyMapMuscle] = useState<BodyMuscle | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)

  /** 1. Filtrar por musculo PRIMERO — body map puede forzar filtro adicional */
  const filteredResults = useMemo(() => {
    let base = allResults
    // Filtro por chip de musculo
    if (muscleFilter) {
      const group = MUSCLE_GROUPS.find((g) => g.label === muscleFilter)
      if (group) base = base.filter((ex) =>
        group.values.some((v) => ex.muscle_group.toLowerCase().includes(v)),
      )
    }
    // Filtro adicional por body map con terminos multilingues
    if (bodyMapMuscle) {
      const terms = BODY_MUSCLE_SEARCH[bodyMapMuscle] ?? [bodyMapMuscle.toLowerCase()]
      base = base.filter((ex) =>
        terms.some((t) => ex.muscle_group.toLowerCase().includes(t)),
      )
    }
    return base
  }, [allResults, muscleFilter, bodyMapMuscle])

  /** 2. Paginar DESPUES del filtro */
  const visibleResults = filteredResults.slice(0, visibleCount)
  const hasMore = visibleCount < filteredResults.length

  function handleFilterChange(label: string) {
    setMuscleFilter(label === muscleFilter ? '' : label)
    setBodyMapMuscle(null) // Limpiar body map al usar chips
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      {isOpen && (
      <div className="sheet-overlay" onClick={addingId ? undefined : onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />

        <div className="sheet__header">
          <h3 className="sheet__title">Agregar ejercicio</h3>
          <div className="sheet__header-actions">
            {/* Boton body map — visual, aislado */}
            <IconButton
              icon={PersonStanding}
              ariaLabel="Mapa muscular"
              size="sm"
              variant={showBodyMap ? 'filled' : 'ghost'}
              onClick={() => setShowBodyMap((v) => !v)}
              className={!showBodyMap ? "map-btn-pulse" : ""}
            />
            {/* Boton crear ejercicio propio */}
            <IconButton
              icon={PenLine}
              ariaLabel="Crear ejercicio"
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateForm(true)}
            />
            <IconButton icon={X} ariaLabel="Cerrar" size="sm" onClick={onClose} />
          </div>
        </div>

        {/* Body Map — se despliega debajo del header, sobre los chips */}
        {showBodyMap && (
          <div className="sheet__body-map">
            <BodyMap
              selected={bodyMapMuscle}
              onSelect={(m) => {
                setBodyMapMuscle(m)
                setMuscleFilter('') // Limpiar chip al usar body map
                setVisibleCount(PAGE_SIZE)
                if (m !== null) setShowBodyMap(false)
              }}
            />
          </div>
        )}

        <div className="sheet__search">
          <Search size={16} className="sheet__search-icon" />
          <input
            className="sheet__search-input"
            placeholder="Buscar ejercicio..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
            autoFocus
          />
        </div>

        <div className="sheet__filters">
          <button
            className={`sheet__filter-chip ${!muscleFilter && !bodyMapMuscle ? 'sheet__filter-chip--active' : ''}`}
            onClick={() => { setMuscleFilter(''); setBodyMapMuscle(null); setVisibleCount(PAGE_SIZE) }}
          >
            Todos
          </button>
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg.label}
              className={`sheet__filter-chip ${muscleFilter === mg.label ? 'sheet__filter-chip--active' : ''}`}
              onClick={() => handleFilterChange(mg.label)}
            >
              {mg.label}
            </button>
          ))}
        </div>

        <div className="sheet__results">
          {loading && (
            <div className="loading-fullscreen" style={{ minHeight: '30vh' }}>
              <HamsterLoader size={120} />
              <span className="loading-fullscreen__label">Buscando ejercicios...</span>
            </div>
          )}

          {!loading && filteredResults.length === 0 && (
            <p className="sheet__empty">Sin resultados</p>
          )}

          {!loading && visibleResults.map((ex) => (
            <ExerciseResultItem
              key={ex.id}
              exercise={ex}
              adding={addingId === ex.id}
              anyAdding={addingId !== null}
              onAdd={async () => {
                if (addingId) return // Prevent double-tap
                setAddingId(ex.id)
                try {
                  await onAdd(ex)
                } finally {
                  setAddingId(null)
                }
              }}
              onPreview={onPreview ? () => onPreview(ex) : undefined}
            />
          ))}

          {!loading && hasMore && (
            <div className="sheet__load-more">
              <Button variant="ghost" size="sm" onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}>
                <ChevronDown size={14} />
                Cargar mas ({filteredResults.length - visibleCount} restantes)
              </Button>
            </div>
          )}

          {!loading && filteredResults.length > 0 && (
            <p className="sheet__count">
              Mostrando {visibleResults.length} de {filteredResults.length} ejercicio{filteredResults.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
      </div>
      )}

      {/* CreateExerciseForm — montado fuera del sheet para evitar clipping */}
      <CreateExerciseForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreated={(exercise) => {
          setShowCreateForm(false)
          onAdd(exercise)
        }}
      />
    </>
  )
}

/* --- Exercise Result Item --- */

type ExerciseResultItemProps = {
  exercise: ExerciseCatalogRow
  adding: boolean
  anyAdding: boolean
  onAdd: () => void
  onPreview?: () => void
}

function ExerciseResultItem({ exercise, adding, anyAdding, onAdd, onPreview }: ExerciseResultItemProps) {
  return (
    <button
      className={`sheet__result-item ${adding ? 'sheet__result-item--adding' : ''}`}
      onClick={onPreview ?? onAdd}
      disabled={anyAdding}
    >
      <div className="sheet__result-icon">
        {exercise.image_url ? (
          <img
            src={exercise.image_url}
            alt={exercise.name}
            className="sheet__result-icon-img"
            loading="lazy"
          />
        ) : (
          <Dumbbell size={16} />
        )}
      </div>
      <div className="sheet__result-info">
        <span className="sheet__result-name">{exercise.name}</span>
        <span className="sheet__result-meta">
          {toSpanishMuscle(exercise.muscle_group)}
          {exercise.equipment ? ` · ${exercise.equipment}` : ''}
        </span>
      </div>
      {adding ? (
        <HamsterLoader size={20} className="sheet__result-add" />
      ) : (
        <Plus size={16} className="sheet__result-add" onClick={(e) => { e.stopPropagation(); onAdd() }} />
      )}
    </button>
  )
}
