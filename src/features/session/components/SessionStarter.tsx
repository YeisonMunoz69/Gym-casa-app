/* ============================================================
   SessionStarter.tsx — Selector de rutina + día para iniciar sesión
   FASE 03 — GYM-YJMG
   Responsabilidad: muestra rutina activa y días disponibles.
   Al confirmar, llama startSession del hook padre.
   ============================================================ */
import { useState, useEffect } from 'react'
import { Play, Dumbbell, Calendar } from 'lucide-react'
import { useRoutines } from '../../routines/hooks/useRoutines'
import { useActiveSession } from '../hooks/useActiveSession'
import { useSessionStore } from '../../../stores/sessionStore'
import { showToast } from '../../../components/ui/Toast'
import { WEEKDAY_LABELS } from '../../../types/routine'
import type { RoutineDayRow } from '../../../types/routine'
import { OneRMCard } from '../../dashboard/components/OneRMCard'
import './SessionStarter.css'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'

type SessionStarterProps = {
  onSessionStarted: () => void
}

export function SessionStarter({ onSessionStarted }: SessionStarterProps) {
  const { routines, loading } = useRoutines()
  const { startSession, isLoading, error } = useActiveSession()
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)

  const activeRoutines = routines.filter((r) => r.is_active)
  const activeRoutine = activeRoutines.find((r) => r.id === selectedRoutineId) ?? activeRoutines[0] ?? null
  const days = activeRoutine?.routine_days ?? []

  // Reset día seleccionado cuando cambia la rutina
  if (activeRoutine && selectedRoutineId !== activeRoutine.id) {
    setSelectedRoutineId(activeRoutine.id)
    setSelectedDayId(null)
  }

  async function handleStart() {
    if (!activeRoutine || !selectedDayId) return
    const day = days.find((d) => d.id === selectedDayId)
    if (!day) return

    await startSession({
      routineId: activeRoutine.id,
      routineDayId: selectedDayId,
      dayLabel: WEEKDAY_LABELS[day.weekday] ?? `Día ${day.weekday}`,
    })
  }

  // Effect para mostrar toast si hay error
  useEffect(() => {
    if (error) {
      showToast(error, 'error')
    }
  }, [error])

  // Llama onSessionStarted si status cambia a active
  const status = useSessionStore(s => s.status)
  useEffect(() => {
    if (status === 'active') {
      onSessionStarted()
    }
  }, [status, onSessionStarted])

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <HamsterLoader size={120} />
        <span className="loading-fullscreen__label">Cargando rutina...</span>
      </div>
    )
  }

  if (!activeRoutine) {
    return (
      <div className="session-starter session-starter--empty">
        <Dumbbell size={48} strokeWidth={1.5} />
        <h2>Sin rutina activa</h2>
        <p>Ve a Rutinas y activa una para poder entrenar.</p>
      </div>
    )
  }

  return (
    <div className="session-starter">
      {activeRoutines.length > 1 && (
        <div className="session-starter__routine-selector">
          <p className="session-starter__subtitle">Selecciona rutina</p>
          <div className="session-starter__routine-chips">
            {activeRoutines.map((r) => (
              <button
                key={r.id}
                className={`session-starter__routine-chip ${r.id === activeRoutine.id ? 'session-starter__routine-chip--active' : ''}`}
                onClick={() => {
                  setSelectedRoutineId(r.id)
                  setSelectedDayId(null)
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="session-starter__hero">
        <Dumbbell size={32} className="session-starter__hero-icon" />
        <div>
          <p className="session-starter__label">Rutina activa</p>
          <h1 className="session-starter__routine-name">{activeRoutine.name}</h1>
        </div>
      </div>

      <p className="session-starter__subtitle">Selecciona el día de hoy</p>

      <div className="session-starter__days">
        {days.map((day: RoutineDayRow) => {
          const isSelected = day.id === selectedDayId
          return (
            <button
              key={day.id}
              type="button"
              className={`session-starter__day-btn ${isSelected ? 'session-starter__day-btn--selected' : ''}`}
              onClick={() => setSelectedDayId(day.id)}
            >
              <span className="session-starter__day-radio">
                <Calendar size={16} />
              </span>
              <span className="session-starter__day-text">
                {WEEKDAY_LABELS[day.weekday] ?? `Día ${day.weekday}`}
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="session-starter__error">{error}</p>}

      {/* 1RM estimado — colapsado por defecto; el usuario lo abre si lo necesita */}
      <OneRMCard collapsible />

      <button
        className="session-starter__start-btn"
        onClick={handleStart}
        disabled={!selectedDayId || isLoading}
      >
        {isLoading ? (
          <HamsterLoader size={24} />
        ) : (
          <Play size={20} fill="currentColor" />
        )}
        {isLoading ? 'Iniciando...' : 'Comenzar entrenamiento'}
      </button>
    </div>
  )
}
