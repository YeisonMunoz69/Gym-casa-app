/* ============================================================
   UserStatsGrid.tsx — Grid de metricas del usuario
   FASE 06 — GYM-YJMG
   Subcomponente puro: recibe stats y las muestra.
   Limite: 80 lineas — SKILL-CODE §2.4
   ============================================================ */
import { Activity, Clock, Flame, Dumbbell, Trophy, Calendar } from 'lucide-react'
import { toSpanishMuscle } from '../../utils/muscleGroupLabels'
import type { UserStats } from '../../services/user-stats.service'
import './UserStatsGrid.css'

type Props = { stats: UserStats; loading: boolean }

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatLastSession(days: number | null): string {
  if (days === null) return 'Sin sesiones'
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days} dias`
}

type StatCardProps = {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: string
  accent?: boolean
}

function StatCard({ icon: Icon, label, value, accent = false }: StatCardProps) {
  return (
    <div className={`stats-grid__card ${accent ? 'stats-grid__card--accent' : ''}`}>
      <div className="stats-grid__icon">
        <Icon size={16} />
      </div>
      <div className="stats-grid__value">{value}</div>
      <div className="stats-grid__label">{label}</div>
    </div>
  )
}

export function UserStatsGrid({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="stats-grid stats-grid--loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stats-grid__skeleton" />
        ))}
      </div>
    )
  }

  const muscleLabel = stats.topMuscleGroup
    ? toSpanishMuscle(stats.topMuscleGroup)
    : 'Sin datos'

  return (
    <div className="stats-grid">
      <StatCard icon={Activity}  label="Sesiones"       value={String(stats.totalSessions)} />
      <StatCard icon={Clock}     label="Tiempo total"   value={formatMinutes(stats.totalMinutes)} />
      <StatCard icon={Flame}     label="Racha actual"   value={`${stats.currentStreak} dias`} accent={stats.currentStreak >= 3} />
      <StatCard icon={Dumbbell}  label="Musculo top"    value={muscleLabel} />
      <StatCard icon={Calendar}  label="Ultima sesion"  value={formatLastSession(stats.daysSinceLastSession)} />
      <StatCard icon={Trophy}    label="Promedio/semana" value={stats.totalSessions > 0 ? `${(stats.totalSessions / Math.max(1, (stats.daysSinceLastSession ?? 0) / 7)).toFixed(1)}` : '0'} />
    </div>
  )
}
