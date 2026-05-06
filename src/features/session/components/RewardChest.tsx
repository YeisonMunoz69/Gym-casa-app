/* ============================================================
   RewardChest.tsx — Cofre de recompensa gamificado
   FASE 06 — GYM-YJMG
   SVG puro + framer-motion. Feedback háptico. 5 clicks para abrir.
   Sin emojis (SKILL-CODE §5.4). Al aceptar → BonusExerciseTracker.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Gift, Zap } from 'lucide-react'
import { BonusExerciseTracker } from './BonusExerciseTracker'
import type { RewardExercise } from '../hooks/useRewardChest'
import './RewardChest.css'

type RewardChestProps = {
  reward: RewardExercise
  onClose: () => void
  onBonusCompleted: (performed: { weight: number; reps: number }) => void   // Guarda en historial y cierra todo
}

type ChestPhase = 'closed' | 'revealed' | 'tracking'

const MAX_CLICKS = 5

export function RewardChest({ reward, onClose, onBonusCompleted }: RewardChestProps) {
  const [clicks, setClicks] = useState(0)
  const [phase, setPhase] = useState<ChestPhase>('closed')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleTap() {
    if (phase !== 'closed') return
    const next = clicks + 1
    setClicks(next)
    if ('vibrate' in navigator) {
      navigator.vibrate(next === MAX_CLICKS ? [100, 50, 200, 50, 400] : 50 + next * 20)
    }
    if (next >= MAX_CLICKS) setPhase('revealed')
  }

  const shakeX = Array.from({ length: 6 }, (_, i) => (i % 2 === 0 ? -(clicks * 4) : clicks * 4))
  const chestScale = 1 + clicks * 0.07

  if (phase === 'tracking') {
    return (
      <BonusExerciseTracker
        reward={reward}
        onFinish={onBonusCompleted}
        onSkip={onClose}
      />
    )
  }

  return (
    <div className="reward-chest__overlay">
      <button className="reward-chest__dismiss" onClick={onClose} aria-label="Cerrar sin reclamar">
        <X size={20} />
      </button>

      <AnimatePresence mode="wait">
        {phase === 'closed' ? (
          <motion.div key="chest" className="reward-chest__stage" onClick={handleTap}>
            <p className="reward-chest__cta">
              {clicks === 0
                ? 'Toca el cofre para abrirlo'
                : `${MAX_CLICKS - clicks} toque${MAX_CLICKS - clicks !== 1 ? 's' : ''} mas...`
              }
            </p>

            <motion.div
              className="reward-chest__svg-wrap"
              animate={{ x: shakeX, scale: chestScale }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              style={{ filter: `drop-shadow(0 0 ${clicks * 8}px hsl(38,92%,50%))` }}
            >
              <TreasureChestSVG progress={clicks / MAX_CLICKS} />
            </motion.div>

            <div className="reward-chest__progress-bar">
              <motion.div
                className="reward-chest__progress-fill"
                animate={{ width: `${(clicks / MAX_CLICKS) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reward"
            className="reward-chest__reward"
            initial={{ opacity: 0, scale: 0.4, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.span key={i} className="reward-chest__particle"
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ opacity: 0, x: (i % 2 === 0 ? 1 : -1) * (40 + i * 15), y: -(60 + i * 20), scale: 0 }}
                transition={{ duration: 0.8, delay: i * 0.07 }}
              >
                <Sparkles size={14} />
              </motion.span>
            ))}

            <div className="reward-chest__badge">
              <Gift size={40} strokeWidth={1.5} />
            </div>
            <div className="reward-chest__rarity">
              <Zap size={12} />
              <span>Ejercicio Bonus</span>
            </div>
            <h2 className="reward-chest__name">{reward.name}</h2>
            <p className="reward-chest__muscle">{reward.muscleGroup}</p>
            <div className="reward-chest__stats">
              <span className="reward-chest__stat">{reward.sets} series</span>
              <span className="reward-chest__stat-sep">x</span>
              <span className="reward-chest__stat">{reward.reps} reps</span>
            </div>
            <p className="reward-chest__note">
              Este ejercicio se contara en tu historial de hoy pero no modifica tu rutina guardada.
            </p>
            <div className="reward-chest__actions">
              <motion.button
                className="reward-chest__accept-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('tracking')}
              >
                Aceptar el reto
              </motion.button>
              <button className="reward-chest__skip-btn" onClick={onClose}>
                No por ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TreasureChestSVG({ progress }: { progress: number }) {
  const lidAngle = -progress * 35
  return (
    <svg viewBox="0 0 120 100" width="180" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(32,80%,42%)" />
          <stop offset="100%" stopColor="hsl(22,70%,28%)" />
        </linearGradient>
        <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(38,90%,55%)" />
          <stop offset="100%" stopColor="hsl(30,78%,38%)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation={`${1 + progress * 3}`} result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="10" y="50" width="100" height="48" rx="6" fill="url(#bodyGrad)" />
      <rect x="10" y="50" width="100" height="8" rx="2" fill="hsl(38,80%,60%)" opacity="0.4" />
      <g transform={`rotate(${lidAngle}, 60, 50)`}>
        <rect x="10" y="22" width="100" height="30" rx="8" fill="url(#lidGrad)" filter="url(#glow)" />
        <rect x="10" y="22" width="100" height="8" rx="6" fill="hsl(45,95%,68%)" opacity="0.5" />
      </g>
      <rect x="50" y="46" width="20" height="12" rx="4" fill="hsl(45,90%,55%)" filter="url(#glow)" />
      <circle cx="60" cy="49" r="4" fill="hsl(38,60%,30%)" />
      {[22, 98].map((x) => (
        <rect key={x} x={x} y="50" width="6" height="48" rx="2" fill="hsl(38,70%,48%)" opacity="0.7" />
      ))}
    </svg>
  )
}
