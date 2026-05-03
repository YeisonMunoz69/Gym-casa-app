/* ============================================================
   SessionDetailScreen.tsx — Detalle de una sesión completada
   FASE 04 — GYM-YJMG
   Responsabilidad: Muestra ejercicios + sets de una sesión.
   Si no hay sets, muestra estado vacío.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { ArrowLeft, Dumbbell, Layers } from 'lucide-react'
import { getSessionDetail, type SessionExerciseDetail } from '../../../services/history.service'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import './SessionDetailScreen.css'

type Props = {
  sessionId: string
  sessionLabel: string
  sessionDate: string
  onBack: () => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

type ExerciseCardProps = { exercise: SessionExerciseDetail }

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const hasSets = exercise.sets.length > 0
  return (
    <div className="sds-card">
      <div className="sds-card__header">
        <Dumbbell size={16} className="sds-card__icon" aria-hidden="true" />
        <div className="sds-card__info">
          <span className="sds-card__name">{exercise.exercise_name}</span>
          {exercise.muscle_group && (
            <span className="sds-card__muscle">{exercise.muscle_group}</span>
          )}
        </div>
      </div>
      {hasSets ? (
        <table className="sds-table">
          <thead>
            <tr>
              <th className="sds-table__th">Set</th>
              <th className="sds-table__th">Peso</th>
              <th className="sds-table__th">Reps</th>
              <th className="sds-table__th">RIR</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((s) => (
              <tr key={s.set_number} className="sds-table__row">
                <td className="sds-table__td sds-table__td--num">{s.set_number}</td>
                <td className="sds-table__td">{s.weight != null ? `${s.weight} kg` : '—'}</td>
                <td className="sds-table__td">{s.reps ?? '—'}</td>
                <td className="sds-table__td">{s.rir ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="sds-card__no-sets">Sin sets registrados</p>
      )}
    </div>
  )
}

function EmptySession() {
  return (
    <div className="sds-empty">
      <Layers size={48} strokeWidth={1.5} />
      <p className="sds-empty__title">Sesión sin registros</p>
      <span className="sds-empty__hint">
        Esta sesión fue completada pero no se guardaron sets.
      </span>
    </div>
  )
}

export function SessionDetailScreen({ sessionId, sessionLabel, sessionDate, onBack }: Props) {
  const [exercises, setExercises] = useState<SessionExerciseDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await getSessionDetail(sessionId)
      if (err) setError(err)
      else setExercises(data)
      setLoading(false)
    }
    load()
  }, [sessionId])

  return (
    <div className="sds-screen">
      <div className="sds-header">
        <button className="sds-header__back" onClick={onBack} aria-label="Volver al historial">
          <ArrowLeft size={20} />
        </button>
        <div className="sds-header__info">
          <h1 className="sds-header__title">{sessionLabel}</h1>
          <span className="sds-header__date">{formatDate(sessionDate)}</span>
        </div>
      </div>

      {loading && (
        <div className="loading-fullscreen">
          <HamsterLoader size={80} />
          <span className="loading-fullscreen__label">Cargando sesión...</span>
        </div>
      )}

      {!loading && error && <p className="sds-error">{error}</p>}

      {!loading && !error && exercises.length === 0 && <EmptySession />}

      {!loading && !error && exercises.length > 0 && (
        <div className="sds-list">
          {exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  )
}
