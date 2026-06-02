/* ============================================================
   WeightSuggestionChip.tsx — v2.2 — respeta SKILL-DESIGN.md
   - Sin emojis (usa iconos SVG Lucide — §10 anti-patrones)
   - Sin Loader2 como indicador principal — usa spinner CSS inline
     (Loader2 está prohibido como pantalla completa; aquí es chip inline)
   - Todos los tokens viven en el CSS, sin valores inline
   ============================================================ */
import { Brain, Dumbbell, Hash } from 'lucide-react'
import { motion } from 'framer-motion'
import type { SuggestionStatus } from '../hooks/useWeightSuggestion'
import './WeightSuggestionChip.css'

type WeightSuggestionChipProps = {
  suggestedWeight: number | null
  suggestedReps:   number | null
  status:          SuggestionStatus
  onApply:         (weight: number, reps: number | null) => void
  weightUnit?:     string
}

export function WeightSuggestionChip({
  suggestedWeight,
  suggestedReps,
  status,
  onApply,
  weightUnit = 'kg',
}: WeightSuggestionChipProps) {
  const isActionable =
    status !== 'loading' && status !== 'no-data' && suggestedWeight !== null
  const isPartial = status === 'partial'
  const isLoading = status === 'loading'
  const isNoData  = status === 'no-data'
  const hasReps   = suggestedReps !== null && suggestedReps > 0

  return (
    <motion.div
      className={`ai-chip ai-chip--${status}`}
      initial={{ opacity: 0, scale: 0.92, y: 3 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Icono — spinner CSS inline si cargando, Brain si no.
          SKILL-DESIGN §2: Loader2 prohibido como loader de pantalla completa.
          Aquí es un chip inline, por lo que se usa un spinner CSS propio. */}
      {isLoading ? (
        <span className="ai-chip__spinner" aria-hidden="true" />
      ) : (
        <Brain size={10} className="ai-chip__icon" aria-hidden="true" />
      )}

      {/* Label — texto sin emoji (§10 anti-patrones) */}
      <span className="ai-chip__label">
        {isLoading && 'Analizando'}
        {isNoData  && 'Sin historial'}
        {isPartial && 'IA estima'}
        {!isLoading && !isNoData && !isPartial && 'IA sugiere'}
      </span>

      {/* Divisor */}
      {isActionable && <span className="ai-chip__divider" aria-hidden="true" />}

      {/* Valores: peso [× reps] — botón táctil */}
      {isActionable && suggestedWeight !== null ? (
        <button
          className="ai-chip__values"
          onClick={() => onApply(suggestedWeight, suggestedReps)}
          aria-label={`Aplicar sugerencia IA: ${suggestedWeight} ${weightUnit}${hasReps ? ` × ${suggestedReps} repeticiones` : ''}`}
        >
          {/* Peso */}
          <span className="ai-chip__value-block">
            <Dumbbell size={8} className="ai-chip__value-icon" aria-hidden="true" />
            <span className="ai-chip__value">
              {suggestedWeight}
              <span className="ai-chip__unit">{weightUnit}</span>
            </span>
          </span>

          {/* Reps — solo con modelo v2 (reps > 0) */}
          {hasReps && (
            <>
              <span className="ai-chip__sep" aria-hidden="true">×</span>
              <span className="ai-chip__value-block">
                <Hash size={8} className="ai-chip__value-icon" aria-hidden="true" />
                <span className="ai-chip__value">
                  {suggestedReps}
                  <span className="ai-chip__unit">reps</span>
                </span>
              </span>
            </>
          )}

          <span className="ai-chip__apply-hint" aria-hidden="true">→</span>
        </button>
      ) : !isLoading ? (
        <span className="ai-chip__empty">
          {isNoData ? 'sin historial' : '…'}
        </span>
      ) : null}

      {/* Barra de confianza pulsante (solo en partial) */}
      {isPartial && (
        <div className="ai-chip__confidence" aria-hidden="true">
          <div className="ai-chip__confidence-bar ai-chip__confidence-bar--partial" />
        </div>
      )}
    </motion.div>
  )
}
