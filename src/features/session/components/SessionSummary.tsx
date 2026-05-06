/* ============================================================
   SessionSummary.tsx — Pantalla de resumen al finalizar sesión
   FASE 06 update — GYM-YJMG
   Responsabilidad: mostrar métricas + activar cofre de recompensa.
   ============================================================ */
import { useState } from 'react'
import { CheckCircle, Weight, Clock, Layers, Trophy, TrendingUp, Gift } from 'lucide-react'
import type { SessionSummaryData } from '../../../types/session'
import type { SessionExerciseItem } from '../../../types/session'
import { useProfileStore } from '../../../stores/profileStore'
import { useChestEnabled } from '../hooks/useChestEnabled'
import { useRewardChest } from '../hooks/useRewardChest'
import { RewardChest } from './RewardChest'
import { addBonusExerciseToHistory } from '../../../services/sessions.service'
import { useAuthStore } from '../../../stores/authStore'
import './SessionSummary.css'

type SessionSummaryProps = {
  data: SessionSummaryData
  exercises: SessionExerciseItem[]
  onClose: () => void
  /** Notifica al padre que el bonus fue completado (para mostrar motivación con bonus) */
  onBonusAccepted?: () => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg.toFixed(0)} kg`
}

export function SessionSummary({ data, exercises, onClose, onBonusAccepted }: SessionSummaryProps) {
  const bodyWeight = useProfileStore((s) => s.profile?.initial_weight_kg)
  const { chestEnabled } = useChestEnabled()
  const userId = useAuthStore((s) => s.user?.id)
  const [showChest, setShowChest] = useState(false)

  const { reward } = useRewardChest(exercises)

  const relativeRatio = (bodyWeight && bodyWeight > 0 && data.totalVolume > 0)
    ? (data.totalVolume / bodyWeight).toFixed(1) : null

  const metrics = [
    { id: 'sets',      icon: Layers,  label: 'Series completadas', value: data.totalSets.toString() },
    { id: 'volume',    icon: Weight,  label: 'Volumen total',       value: formatVolume(data.totalVolume) },
    { id: 'duration',  icon: Clock,   label: 'Duración',            value: formatDuration(data.durationSeconds) },
    { id: 'exercises', icon: Trophy,  label: 'Ejercicios',          value: data.exercisesCount.toString() },
  ]

  function handleClose() {
    if (chestEnabled) { setShowChest(true) } else { onClose() }
  }

  async function handleBonusCompleted(performed: { weight: number; reps: number }) {
    if (userId && data.sessionId) {
      await addBonusExerciseToHistory(userId, data.sessionId, reward, performed)
    }
    onBonusAccepted?.()   // Marca bonus completado en el padre
    onClose()             // Muestra pantalla de motivación
  }

  return (
    <>
      <div className="session-summary">
        <div className="session-summary__hero">
          <div className="session-summary__check-ring">
            <CheckCircle size={48} strokeWidth={1.5} />
          </div>
          <h1 className="session-summary__title">Entrenamiento completado</h1>
          <p className="session-summary__day">{data.dayLabel}</p>
        </div>

        <div className="session-summary__metrics">
          {metrics.map(({ id, icon: Icon, label, value }) => (
            <div key={id} className="session-summary__metric">
              <Icon size={20} className="session-summary__metric-icon" />
              <span className="session-summary__metric-value">{value}</span>
              <span className="session-summary__metric-label">{label}</span>
            </div>
          ))}
        </div>

        {relativeRatio && (
          <div className="session-summary__relative">
            <TrendingUp size={16} />
            <span>Levantaste <strong>{relativeRatio}x</strong> tu peso corporal en esta sesión</span>
          </div>
        )}

        <button
          className="session-summary__close-btn"
          onClick={handleClose}
          id="session-summary-close"
        >
          {chestEnabled
            ? (<><Gift size={16} /> Reclamar recompensa</>)
            : 'Ver mi logro'
          }
        </button>
      </div>

      {showChest && (
        <RewardChest
          reward={reward}
          onClose={onClose}
          onBonusCompleted={handleBonusCompleted}
        />
      )}
    </>
  )
}
