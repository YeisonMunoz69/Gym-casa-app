/* ============================================================
   LastPerformanceChip.tsx — respeta SKILL-DESIGN.md
   Reemplaza WeightSuggestionChip.tsx (LSTM retirado, ver
   ml/REPORTE_MODELO1_LSTM.md). Muestra el último peso/reps
   registrados para el ejercicio, con botón para aplicarlos al set.
   - Sin emojis (icono SVG Lucide — §10 anti-patrones)
   - Todos los tokens viven en el CSS, sin valores inline
   ============================================================ */
import { History, Dumbbell, Hash } from 'lucide-react'
import { motion } from 'framer-motion'
import type { LastPerformanceStatus } from '../hooks/useLastPerformance'
import './LastPerformanceChip.css'

type LastPerformanceChipProps = {
  lastWeight: number | null
  lastReps:   number | null
  status:     LastPerformanceStatus
  onApply:    (weight: number, reps: number | null) => void
  weightUnit?: string
}

export function LastPerformanceChip({
  lastWeight,
  lastReps,
  status,
  onApply,
  weightUnit = 'kg',
}: LastPerformanceChipProps) {
  const isLoading = status === 'loading'
  const isNoData  = status === 'no-data'
  const isReady   = status === 'ready' && lastWeight !== null
  const hasReps   = lastReps !== null && lastReps > 0

  return (
    <motion.div
      className={`last-perf-chip last-perf-chip--${status}`}
      initial={{ opacity: 0, scale: 0.92, y: 3 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {isLoading ? (
        <span className="last-perf-chip__spinner" aria-hidden="true" />
      ) : (
        <History size={10} className="last-perf-chip__icon" aria-hidden="true" />
      )}

      <span className="last-perf-chip__label">
        {isLoading && 'Buscando'}
        {isNoData  && 'Sin historial'}
        {isReady   && 'Último registro'}
      </span>

      {isReady && <span className="last-perf-chip__divider" aria-hidden="true" />}

      {isReady && lastWeight !== null ? (
        <button
          className="last-perf-chip__values"
          onClick={() => onApply(lastWeight, lastReps)}
          aria-label={`Aplicar último registro: ${lastWeight} ${weightUnit}${hasReps ? ` × ${lastReps} repeticiones` : ''}`}
        >
          <span className="last-perf-chip__value-block">
            <Dumbbell size={8} className="last-perf-chip__value-icon" aria-hidden="true" />
            <span className="last-perf-chip__value">
              {lastWeight}
              <span className="last-perf-chip__unit">{weightUnit}</span>
            </span>
          </span>

          {hasReps && (
            <>
              <span className="last-perf-chip__sep" aria-hidden="true">×</span>
              <span className="last-perf-chip__value-block">
                <Hash size={8} className="last-perf-chip__value-icon" aria-hidden="true" />
                <span className="last-perf-chip__value">
                  {lastReps}
                  <span className="last-perf-chip__unit">reps</span>
                </span>
              </span>
            </>
          )}

          <span className="last-perf-chip__apply-hint" aria-hidden="true">→</span>
        </button>
      ) : !isLoading ? (
        <span className="last-perf-chip__empty">sin historial</span>
      ) : null}
    </motion.div>
  )
}
