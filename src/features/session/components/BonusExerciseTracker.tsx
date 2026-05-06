/* ============================================================
   BonusExerciseTracker.tsx — Ventana para realizar el ejercicio bonus
   FASE 06 — GYM-YJMG
   Responsabilidad: trackear la serie del ejercicio bonus de recompensa.
   Muestra imagen, tiempo de descanso y permite marcar la serie.
   Sin emojis (SKILL-CODE §5.4). Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, X, Zap, Clock, ChevronRight } from 'lucide-react'
import type { RewardExercise } from '../hooks/useRewardChest'
import './BonusExerciseTracker.css'

type BonusExerciseTrackerProps = {
  reward: RewardExercise
  onFinish: (performed: { weight: number; reps: number }) => void
  onSkip: () => void
}

function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}min`
}

export function BonusExerciseTracker({ reward, onFinish, onSkip }: BonusExerciseTrackerProps) {
  const [done, setDone] = useState(false)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState(reward.reps.toString())

  function handleToggle() {
    if ('vibrate' in navigator) navigator.vibrate(done ? 20 : 40)
    setDone((prev) => !prev)
  }

  return (
    <div className="bonus-tracker__overlay">
      <motion.div
        className="bonus-tracker"
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        {/* Header */}
        <div className="bonus-tracker__header">
          <Zap size={14} className="bonus-tracker__icon" />
          <p className="bonus-tracker__label">Ejercicio Bonus</p>
          <button className="bonus-tracker__skip" onClick={onSkip} aria-label="Omitir ejercicio bonus">
            <X size={18} />
          </button>
        </div>

        {/* Imagen del ejercicio */}
        <div className="bonus-tracker__image-wrap">
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="bonus-tracker__image"
            loading="lazy"
          />
          <div className="bonus-tracker__image-overlay" />
        </div>

        {/* Info del ejercicio */}
        <div className="bonus-tracker__info">
          <h2 className="bonus-tracker__name">{reward.name}</h2>
          <p className="bonus-tracker__muscle">{reward.muscleGroup}</p>
          <div className="bonus-tracker__spec">
            <span className="bonus-tracker__spec-pill">
              {reward.sets} serie
            </span>
            <ChevronRight size={12} className="bonus-tracker__spec-sep" />
            <span className="bonus-tracker__spec-pill">
              {reward.reps} repeticiones
            </span>
            <ChevronRight size={12} className="bonus-tracker__spec-sep" />
            <span className="bonus-tracker__spec-pill bonus-tracker__spec-pill--rest">
              <Clock size={11} />
              {formatRest(reward.restSeconds)} descanso
            </span>
          </div>
        </div>

        {/* Inputs de registro */}
        <div className="bonus-tracker__inputs">
          <label className="bonus-tracker__field">
            <span className="bonus-tracker__field-label">kg</span>
            <input
              className="bonus-tracker__input"
              type="number"
              inputMode="decimal"
              placeholder="—"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              disabled={done}
            />
          </label>
          <label className="bonus-tracker__field">
            <span className="bonus-tracker__field-label">reps</span>
            <input
              className="bonus-tracker__input"
              type="number"
              inputMode="numeric"
              placeholder="—"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              disabled={done}
            />
          </label>
        </div>

        {/* Serie para marcar */}
        <motion.button
          className={`bonus-tracker__set ${done ? 'bonus-tracker__set--done' : ''}`}
          onClick={handleToggle}
          whileTap={{ scale: 0.94 }}
          aria-label={done ? 'Serie completada — tocar para desmarcar' : 'Marcar serie como completada'}
        >
          <span className="bonus-tracker__set-label">
            {done ? 'Serie completada' : 'Tocar al terminar la serie'}
          </span>
          <div className={`bonus-tracker__set-indicator ${done ? 'bonus-tracker__set-indicator--done' : ''}`}>
            {done && <CheckCircle size={18} />}
          </div>
        </motion.button>

        {/* Botón final */}
        <motion.button
          className={`bonus-tracker__finish-btn ${done ? 'bonus-tracker__finish-btn--ready' : ''}`}
          whileTap={{ scale: 0.96 }}
          disabled={!done}
          onClick={() => onFinish({ weight: parseFloat(weight) || 0, reps: parseInt(reps, 10) || 0 })}
        >
          <CheckCircle size={16} />
          {done ? 'Listo — registrar en historial' : 'Completa la serie primero'}
        </motion.button>
      </motion.div>
    </div>
  )
}
