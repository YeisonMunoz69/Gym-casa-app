/* ============================================================
   CatalogScreen.tsx — Pantalla de Catálogo de Ejercicios
   FASE 05 — GYM-YJMG
   Responsabilidad: Lista completa de ejercicios con filtros
   y la gráfica de progresión en la parte superior.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Dumbbell, PersonStanding, Plus } from 'lucide-react'
import { useExerciseSearch } from '../routines/hooks/useExerciseSearch'
import { HamsterLoader } from '../../components/ui/HamsterLoader'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { ProgressByExercise } from '../dashboard/components/ProgressByExercise'
import { RecoveryBodyMap } from '../dashboard/components/RecoveryBodyMap'
import { BodyMap, BODY_MUSCLE_SEARCH } from '../routines/components/BodyMap'
import type { BodyMuscle } from '../routines/components/BodyMap'
import { ExercisePreview } from '../routines/components/ExercisePreview'
import { CreateExerciseForm } from '../routines/components/CreateExerciseForm'
import type { ExerciseCatalogRow } from '../../types/exercise'
import { toSpanishMuscle } from '../../utils/muscleGroupLabels'
import './CatalogScreen.css'

const PAGE_SIZE = 15
const MUSCLE_GROUPS = [
  { label: 'Pecho',         values: ['pecho', 'chest'] },
  { label: 'Espalda',       values: ['espalda', 'back', 'lats'] },
  { label: 'Trapecio',      values: ['trapecio', 'traps', 'trapezius'] },
  { label: 'Hombros',       values: ['hombros', 'shoulders', 'deltoids'] },
  { label: 'Biceps',        values: ['biceps', 'bicep'] },
  { label: 'Triceps',       values: ['triceps', 'tricep'] },
  { label: 'Antebrazos',    values: ['antebrazos', 'forearms'] },
  { label: 'Piernas',       values: ['piernas', 'legs', 'quads', 'quadriceps', 'hamstrings', 'pierna'] },
  { label: 'Gluteos',       values: ['gluteos', 'glutes'] },
  { label: 'Abdomen',       values: ['abdomen', 'abs', 'abdominales', 'core'] },
  { label: 'Pantorrilla',   values: ['pantorrilla', 'calves'] },
  { label: 'Cuello',        values: ['cuello', 'neck'] },
  { label: 'Cardio',        values: ['cardio'] },
  { label: 'Cuerpo Completo', values: ['cuerpo completo', 'full body'] },
  { label: 'Estiramiento',  values: ['estiramiento', 'stretching', 'stretch', 'flexibility', 'movilidad', 'mobility'] },
  { label: 'Bonificacion',  values: ['bonificacion', 'bonificación'] },
]

function CatalogItem({ exercise, onClick }: { exercise: ExerciseCatalogRow; onClick: () => void }) {
  return (
    <button className="cat-item" onClick={onClick}>
      <div className="cat-item__icon">
        {exercise.image_url ? (
          <img src={exercise.image_url} alt={exercise.name} className="cat-item__img" loading="lazy" />
        ) : (
          <Dumbbell size={20} />
        )}
      </div>
      <div className="cat-item__info">
        <span className="cat-item__name">{exercise.name}</span>
        <span className="cat-item__meta">
          {toSpanishMuscle(exercise.muscle_group)}
          {exercise.equipment ? ` · ${exercise.equipment}` : ''}
        </span>
      </div>
    </button>
  )
}

export function CatalogScreen() {
  const { allResults, query, loading, setQuery, reload } = useExerciseSearch()
  const [muscleFilter, setMuscleFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showBodyMap, setShowBodyMap] = useState(false)
  const [bodyMapMuscle, setBodyMapMuscle] = useState<BodyMuscle | null>(null)
  const [previewExercise, setPreviewExercise] = useState<ExerciseCatalogRow | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'progress' | 'recovery'>('progress')

  const filteredResults = useMemo(() => {
    let base = allResults
    if (muscleFilter) {
      const group = MUSCLE_GROUPS.find((g) => g.label === muscleFilter)
      if (group) base = base.filter((ex) =>
        group.values.some((v) => ex.muscle_group.toLowerCase().includes(v)),
      )
    }
    if (bodyMapMuscle) {
      const terms = BODY_MUSCLE_SEARCH[bodyMapMuscle] ?? [bodyMapMuscle.toLowerCase()]
      base = base.filter((ex) =>
        terms.some((t) => ex.muscle_group.toLowerCase().includes(t)),
      )
    }
    return base
  }, [allResults, muscleFilter, bodyMapMuscle])

  const visibleResults = filteredResults.slice(0, visibleCount)
  const hasMore = visibleCount < filteredResults.length

  function handleFilterChange(label: string) {
    setMuscleFilter(label === muscleFilter ? '' : label)
    setBodyMapMuscle(null)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="catalog-screen">
      {/* 1. Progresión y Recuperación en la parte superior */}
      <div className="catalog-screen__progress-section">
        <div className="catalog-tabs">
          <button 
            className={`catalog-tab-btn ${activeTab === 'progress' ? 'catalog-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            Progresión
          </button>
          <button 
            className={`catalog-tab-btn ${activeTab === 'recovery' ? 'catalog-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('recovery')}
          >
            Recuperación
          </button>
        </div>
        <div className="catalog-tab-content">
          {activeTab === 'progress' ? <ProgressByExercise /> : <RecoveryBodyMap />}
        </div>
      </div>

      <div className="catalog-screen__header">
        <h1 className="catalog-screen__title">Catalogo de Ejercicios</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <IconButton
            icon={Plus}
            ariaLabel="Agregar ejercicio"
            size="sm"
            variant="filled"
            onClick={() => setShowAddDialog(true)}
          />
          <IconButton
            icon={PersonStanding}
            ariaLabel="Mapa muscular"
            size="sm"
            variant={showBodyMap ? 'filled' : 'ghost'}
            onClick={() => setShowBodyMap((v) => !v)}
            className={!showBodyMap ? "map-btn-pulse" : ""}
          />
        </div>
      </div>

      {showBodyMap && (
        <div className="cat-body-map">
          <BodyMap
            selected={bodyMapMuscle}
            onSelect={(m) => {
              setBodyMapMuscle(m)
              setMuscleFilter('')
              setVisibleCount(PAGE_SIZE)
              if (m !== null) setShowBodyMap(false)
            }}
          />
        </div>
      )}

      {/* 2. Buscador */}
      <div className="cat-search">
        <Search size={16} className="cat-search__icon" />
        <input
          className="cat-search__input"
          placeholder="Buscar ejercicio..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
        />
      </div>

      {/* 3. Filtros */}
      <div className="cat-filters">
        <button
          className={`cat-filters__chip ${!muscleFilter && !bodyMapMuscle ? 'cat-filters__chip--active' : ''}`}
          onClick={() => { setMuscleFilter(''); setBodyMapMuscle(null); setVisibleCount(PAGE_SIZE) }}
        >
          Todos
        </button>
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg.label}
            className={`cat-filters__chip ${muscleFilter === mg.label ? 'cat-filters__chip--active' : ''}`}
            onClick={() => handleFilterChange(mg.label)}
          >
            {mg.label}
          </button>
        ))}
      </div>

      {/* 4. Lista */}
      <div className="cat-list">
        {loading && (
          <div className="loading-fullscreen" style={{ minHeight: '30vh' }}>
            <HamsterLoader size={80} />
            <span className="loading-fullscreen__label">Cargando ejercicios...</span>
          </div>
        )}

        {!loading && filteredResults.length === 0 && (
          <p className="cat-list__empty">Sin resultados para tu búsqueda</p>
        )}

        {!loading && visibleResults.map((ex) => (
          <CatalogItem key={ex.id} exercise={ex} onClick={() => setPreviewExercise(ex)} />
        ))}

        {!loading && hasMore && (
          <div className="cat-list__more">
            <Button variant="ghost" size="sm" fullWidth onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}>
              <ChevronDown size={14} />
              Cargar mas ({filteredResults.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </div>

      {/* Floating Scroll Buttons */}
      <div className="cat-scroll-actions">
        <button
          type="button"
          className="cat-scroll-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="cat-scroll-icon">
            <ChevronUp size={16} />
          </span>
          <span className="cat-scroll-text">Subir</span>
        </button>
        <button
          type="button"
          className="cat-scroll-btn"
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
        >
          <span className="cat-scroll-icon">
            <ChevronDown size={16} />
          </span>
          <span className="cat-scroll-text">Bajar</span>
        </button>
      </div>

      {previewExercise && (
        <ExercisePreview
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
          onSaved={() => {
            reload?.()
            setPreviewExercise(null)
          }}
        />
      )}

      <CreateExerciseForm
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onCreated={() => { reload?.(); setShowAddDialog(false) }}
      />
    </div>
  )
}
