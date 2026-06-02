/* ============================================================
   OneRMCard.tsx — Tarjeta de 1RM estimado por ejercicio
   GYM-YJMG — FASE 03

   Muestra los top ejercicios con su 1RM estimado (Modelo 4).
   Fórmula: 1RM = coef_a * peso + coef_b * reps + intercept
   (Regresión lineal v2.0, consenso 4 fórmulas de la literatura)
   ============================================================ */
import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, Dumbbell, ChevronDown, ChevronUp, X, LineChart, ImageIcon } from 'lucide-react'
import { createPortal } from 'react-dom'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useOneRM } from '../hooks/useOneRM'
import { AIInfoBadge } from '../../../components/ui/AIInfoBadge'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { OneRMChart } from './OneRMChart'
import './OneRMCard.css'

// ─── Tipos ───────────────────────────────────────────────────

type ExerciseRM = {
  exercise_name: string
  muscle_group:  string
  one_rm:        number
  one_rm_prev:   number | null
  best_set_kg:   number
  best_set_reps: number
  image_url:     string | null
  description:   string | null
}

// ─── Mapeo ejercicio → grupo muscular ────────────────────────

const DB_TO_MUSCLE: Record<string, string> = {
  pecho: 'chest',      chest: 'chest',
  espalda: 'upper_back', back: 'upper_back', lats: 'upper_back',
  trapecio: 'trapezius', traps: 'trapezius',
  hombros: 'deltoids',   shoulders: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  abdomen: 'abdominals', abs: 'abdominals',
  piernas: 'quadriceps', quads: 'quadriceps',
  gluteos: 'gluteals',   glutes: 'gluteals',
  pantorrilla: 'calves', calves: 'calves',
  antebrazos: 'forearms', forearms: 'forearms',
  cuello: 'neck',        neck: 'neck',
}

// ─── Prop types ───────────────────────────────────────────────

type OneRMCardProps = {
  /** Si true, la tarjeta comienza cerrada y el header actúa de toggle */
  collapsible?: boolean
}

// ─── Componente principal ─────────────────────────────────────

export function OneRMCard({ collapsible = false }: OneRMCardProps) {
  const { estimateOneRM, config, loading: modelLoading } = useOneRM()
  const userId = useAuthStore(s => s.user?.id)
  const [exercises, setExercises] = useState<ExerciseRM[]>([])
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(!collapsible)
  const [selected, setSelected]   = useState<ExerciseRM | null>(null)

  const closeModal = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!userId || modelLoading) return

    async function fetchBestSets() {
      setLoading(true)

      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 14)
      const fromStr = fromDate.toISOString().slice(0, 10)

      const prevTo   = new Date()
      prevTo.setDate(prevTo.getDate() - 15)
      const prevFrom = new Date()
      prevFrom.setDate(prevFrom.getDate() - 30)
      const prevFromStr = prevFrom.toISOString().slice(0, 10)
      const prevToStr   = prevTo.toISOString().slice(0, 10)

      // ── Query 1: sesiones recientes (incluye imagen e instrucciones) ─
      const { data: recentData } = await supabase
        .from('sessions')
        .select(`
          session_exercises (
            exercises_catalog ( name, muscle_group, image_url, instructions ),
            session_sets ( weight, reps )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('session_date', fromStr)

      // ── Query 2: periodo anterior (solo para tendencia) ──────────────
      const { data: prevData } = await supabase
        .from('sessions')
        .select(`
          session_exercises (
            exercises_catalog ( name, muscle_group ),
            session_sets ( weight, reps )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('session_date', prevFromStr)
        .lte('session_date', prevToStr)

      // ── Extraer mejor 1RM reciente por ejercicio ──────────────────────
      const bestByExercise: Record<string, {
        name: string; muscle: string; kg: number; reps: number
        imageUrl: string | null; description: string | null
      }> = {}

      for (const session of (recentData || []) as any[]) {
        for (const se of session.session_exercises || []) {
          const name: string       = se?.exercises_catalog?.name || ''
          const rawMuscle: string  = (se?.exercises_catalog?.muscle_group || '').toLowerCase()
          const muscle             = DB_TO_MUSCLE[rawMuscle] ?? rawMuscle
          const imageUrl           = (se?.exercises_catalog?.image_url as string | null) ?? null
          const description        = (se?.exercises_catalog?.instructions as string | null) ?? null
          if (!name) continue

          for (const set of se.session_sets || []) {
            const kg   = Number(set.weight) || 0
            const reps = Number(set.reps) || 0
            if (kg <= 0 || reps <= 0 || reps > 15) continue

            const oneRM  = estimateOneRM(kg, reps, muscle) ?? 0
            const prev   = bestByExercise[name]
            const prevRM = prev ? (estimateOneRM(prev.kg, prev.reps, prev.muscle) ?? 0) : 0
            if (oneRM > prevRM) {
              bestByExercise[name] = { name, muscle, kg, reps, imageUrl, description }
            }
          }
        }
      }

      // ── Extraer mejor 1RM del periodo anterior (solo para tendencia) ──
      const prevBest: Record<string, number> = {}
      for (const session of (prevData || []) as any[]) {
        for (const se of session.session_exercises || []) {
          const name: string      = se?.exercises_catalog?.name || ''
          const rawMuscle: string = (se?.exercises_catalog?.muscle_group || '').toLowerCase()
          const muscle            = DB_TO_MUSCLE[rawMuscle] ?? rawMuscle
          if (!name) continue

          for (const set of se.session_sets || []) {
            const kg   = Number(set.weight) || 0
            const reps = Number(set.reps) || 0
            if (kg <= 0 || reps <= 0 || reps > 15) continue
            const oneRM = estimateOneRM(kg, reps, muscle) ?? 0
            if (!prevBest[name] || oneRM > prevBest[name]) prevBest[name] = oneRM
          }
        }
      }

      // ── Top 5 ─────────────────────────────────────────────────────────
      const result: ExerciseRM[] = Object.values(bestByExercise)
        .map(({ name, muscle, kg, reps, imageUrl, description }) => ({
          exercise_name: name,
          muscle_group:  muscle,
          one_rm:        estimateOneRM(kg, reps, muscle) ?? 0,
          one_rm_prev:   prevBest[name] ?? null,
          best_set_kg:   kg,
          best_set_reps: reps,
          image_url:     imageUrl,
          description:   description,
        }))
        .filter(e => e.one_rm > 0)
        .sort((a, b) => b.one_rm - a.one_rm)
        .slice(0, 5)

      setExercises(result)
      setLoading(false)
    }

    fetchBestSets()
  }, [userId, modelLoading, estimateOneRM])

  // ── Estados de carga / vacío ────────────────────────────────
  if (loading || modelLoading) {
    return (
      <div className="one-rm-card one-rm-card--loading">
        <HamsterLoader size={48} />
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="one-rm-card">
        <div className="one-rm-card__header">
          <Dumbbell size={16} />
          <h3 className="one-rm-card__title">1RM Estimado</h3>
        </div>
        <p className="one-rm-card__empty">
          Registra entrenamientos para ver tu 1RM estimado por ejercicio.
        </p>
      </div>
    )
  }

  // ── Render principal ────────────────────────────────────────
  return (
    <>
      {selected && <ExerciseModal ex={selected} config={config} onClose={closeModal} />}

      <div className={`one-rm-card${collapsible ? ' one-rm-card--collapsible' : ''}`}>

        {/* Header — clickeable si collapsible */}
        <div
          className="one-rm-card__header"
          onClick={collapsible ? () => setOpen(v => !v) : undefined}
          style={collapsible ? { cursor: 'pointer' } : undefined}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? open : undefined}
        >
          <Dumbbell size={16} />
          <h3 className="one-rm-card__title">1RM Estimado</h3>
          <AIInfoBadge title="¿Cómo se calcula el 1RM?">
            <p>El <strong>1 Rep Max (1RM)</strong> es el peso máximo que puedes levantar una sola vez.</p>
            <p>Se estima desde tus sets recientes (peso × reps) con una regresión lineal calibrada sobre miles de sesiones reales.</p>
            <p><strong>Fórmula:</strong> <code>1RM = a × peso + b × reps + c</code></p>
            <p>Coeficientes calibrados por músculo con el consenso de <strong>Epley, Brzycki, Lander y O'Conner</strong>.</p>
          </AIInfoBadge>
          {collapsible && (
            <span className="one-rm-card__chevron" aria-hidden="true">
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </div>

        {/* Lista de ejercicios */}
        {open && (
          <>
            <ul className="one-rm-card__list">
              {exercises.map(ex => {
                const diff = ex.one_rm_prev != null ? ex.one_rm - ex.one_rm_prev : null
                const pct  = (diff != null && ex.one_rm_prev && ex.one_rm_prev > 0)
                  ? (diff / ex.one_rm_prev) * 100
                  : null

                return (
                  <li key={ex.exercise_name}>
                    <button
                      className="one-rm-card__row"
                      onClick={() => setSelected(ex)}
                      type="button"
                      aria-label={`Ver info de ${ex.exercise_name}`}
                    >
                      <div className="one-rm-card__exercise">
                        <span className="one-rm-card__name">{ex.exercise_name}</span>
                        <span className="one-rm-card__set">
                          {ex.best_set_kg} kg × {ex.best_set_reps} reps
                        </span>
                      </div>

                      <div className="one-rm-card__value-wrap">
                        <span className="one-rm-card__value">{ex.one_rm} kg</span>
                        {pct != null && (
                          <span className={`one-rm-card__trend one-rm-card__trend--${
                            pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
                          }`}>
                            {pct > 0 ? <TrendingUp size={12} /> :
                             pct < 0 ? <TrendingDown size={12} /> :
                             <Minus size={12} />}
                            {Math.abs(pct).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            <p className="one-rm-card__note">
              Toca un ejercicio para ver imagen e instrucciones
            </p>
          </>
        )}

        {/* Hint cuando está colapsado */}
        {!open && collapsible && (
          <p className="one-rm-card__collapsed-hint">
            {exercises.length} ejercicio{exercises.length > 1 ? 's' : ''} — toca para expandir
          </p>
        )}
      </div>
    </>
  )
}

/* ─── Modal de ejercicio ─────────────────────────────────────
   Portal renderizado en document.body para evitar clipping.
   ─────────────────────────────────────────────────────────── */

const DESC_LIMIT = 140   // caracteres antes de "leer más"

function ExerciseModal({ ex, config, onClose }: { ex: ExerciseRM; config: any; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'image' | 'chart'>('image')

  const diff = ex.one_rm_prev != null ? ex.one_rm - ex.one_rm_prev : null
  const pct  = (diff != null && ex.one_rm_prev && ex.one_rm_prev > 0)
    ? (diff / ex.one_rm_prev) * 100
    : null

  const desc         = ex.description ?? ''
  const isLong       = desc.length > DESC_LIMIT
  const displayedDesc = !expanded && isLong ? desc.slice(0, DESC_LIMIT).trimEnd() + '…' : desc

  // Obtener coeficientes del modelo para el músculo actual
  const muscleGroup = ex.muscle_group
  const coefs = (config && muscleGroup && config.by_muscle_group[muscleGroup]?.calibrated)
    ? config.by_muscle_group[muscleGroup]
    : config?.global_model

  return createPortal(
    <div className="ex-modal__overlay" onClick={onClose}>
      <div className="ex-modal" onClick={e => e.stopPropagation()}>
        
        {viewMode === 'chart' && coefs ? (
          /* ─── VISTA: GRÁFICA 1RM ─── */
          <>
            <div className="ex-modal__header">
              <h3 className="ex-modal__title">Curva 1RM: {ex.exercise_name}</h3>
              <button className="ex-modal__close" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            
            <div className="ex-modal__chart-wrap ex-modal__chart-wrap--large">
              <OneRMChart 
                coefA={coefs.coef_a}
                coefB={coefs.coef_b}
                intercept={coefs.intercept}
                current1RM={ex.one_rm}
                bestSetKg={ex.best_set_kg}
                bestSetReps={ex.best_set_reps}
              />
            </div>
            
            <button className="ex-modal__dismiss ex-modal__dismiss--back" onClick={() => setViewMode('image')}>
              Volver a Detalles
            </button>
          </>
        ) : (
          /* ─── VISTA: DETALLES DEL EJERCICIO ─── */
          <>
            <div className="ex-modal__header">
              <h3 className="ex-modal__title">{ex.exercise_name}</h3>
              
              <div className="ex-modal__actions">
                {coefs && (
                  <button 
                    className="ex-modal__action-btn"
                    onClick={() => setViewMode('chart')}
                    aria-label="Ver gráfica de regresión"
                    title="Curva de Equivalencia 1RM"
                  >
                    <LineChart size={18} />
                  </button>
                )}
                <button className="ex-modal__close" onClick={onClose} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>
            </div>

            {ex.image_url ? (
              <div className="ex-modal__img-wrap">
                <img
                  src={ex.image_url}
                  alt={ex.exercise_name}
                  className="ex-modal__img"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="ex-modal__img-placeholder">
                <Dumbbell size={40} strokeWidth={1.2} />
              </div>
            )}

            <div className="ex-modal__stats">
              <div className="ex-modal__stat">
                <span className="ex-modal__stat-label">1RM Est.</span>
                <span className="ex-modal__stat-value">{ex.one_rm} kg</span>
              </div>
              <div className="ex-modal__stat">
                <span className="ex-modal__stat-label">Mejor Set</span>
                <span className="ex-modal__stat-value">{ex.best_set_kg} kg × {ex.best_set_reps}</span>
              </div>
              {pct != null && (
                <div className="ex-modal__stat">
                  <span className="ex-modal__stat-label">Tendencia</span>
                  <span className={`ex-modal__stat-value ex-modal__stat-value--${
                    pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
                  }`}>
                    {pct > 0 ? <TrendingUp size={13} /> :
                     pct < 0 ? <TrendingDown size={13} /> :
                     <Minus size={13} />}
                    {Math.abs(pct).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {desc && (
              <div className="ex-modal__desc-wrap">
                <p className="ex-modal__description">{displayedDesc}</p>
                {isLong && (
                  <button
                    className="ex-modal__read-more"
                    onClick={() => setExpanded(v => !v)}
                    type="button"
                  >
                    {expanded ? 'Leer menos' : 'Leer más'}
                  </button>
                )}
              </div>
            )}

            <button className="ex-modal__dismiss" onClick={onClose}>Cerrar</button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
