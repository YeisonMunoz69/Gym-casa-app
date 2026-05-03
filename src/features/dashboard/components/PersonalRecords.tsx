/* ============================================================
   PersonalRecords.tsx — Mejores marcas personales por ejercicio
   FASE 04 — GYM-YJMG
   Responsabilidad: Mostrar PRs con badge "Nuevo" animado para
   PRs de las últimas 4 semanas.
   ============================================================ */
import { Trophy, Zap } from 'lucide-react'
import { usePersonalRecords } from '../hooks/usePersonalRecords'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import './PersonalRecords.css'

function EmptyRecords() {
  return (
    <div className="pr-empty">
      <Trophy size={40} strokeWidth={1.5} />
      <p className="pr-empty__text">Aún no hay marcas personales</p>
      <span className="pr-empty__hint">
        Completa tu primera sesión para registrar récords
      </span>
    </div>
  )
}

type PRRowProps = {
  rank: number
  name: string
  weightKg: number
  reps: number
  oneRepMaxKg: number
  isNew: boolean
}

function PRRow({ rank, name, weightKg, reps, oneRepMaxKg, isNew }: PRRowProps) {
  return (
    <li className="pr-row">
      <span className="pr-row__rank">{rank}</span>
      <div className="pr-row__info">
        <span className="pr-row__name text-truncate">{name}</span>
        <span className="pr-row__detail">
          {weightKg} kg × {reps} rep
        </span>
      </div>
      <div className="pr-row__right">
        <span className="pr-row__1rm">{Math.round(oneRepMaxKg)} kg</span>
        {isNew && (
          <span className="pr-row__badge" aria-label="Nuevo récord">
            <Zap size={10} />
            Nuevo
          </span>
        )}
      </div>
    </li>
  )
}

export function PersonalRecords() {
  const { records, loading, error } = usePersonalRecords()

  if (loading) {
    return (
      <div className="pr-section">
        <div className="pr-header">
          <Trophy size={18} className="pr-header__icon" />
          <h2 className="pr-header__title">Récords Personales</h2>
        </div>
        <div className="pr-loading">
          <HamsterLoader size={60} />
        </div>
      </div>
    )
  }

  return (
    <section className="pr-section">
      <div className="pr-header">
        <Trophy size={18} className="pr-header__icon" />
        <h2 className="pr-header__title">Récords Personales</h2>
        {records.length > 0 && (
          <span className="pr-header__count">{records.length} marcas</span>
        )}
      </div>

      {error && <p className="pr-error">{error}</p>}

      {!error && records.length === 0 && <EmptyRecords />}

      {records.length > 0 && (
        <ul className="pr-list">
          {records.slice(0, 6).map((rec, idx) => (
            <PRRow
              key={rec.id}
              rank={idx + 1}
              name={rec.exercise_name}
              weightKg={rec.weight_kg}
              reps={rec.reps}
              oneRepMaxKg={rec.one_rep_max_kg}
              isNew={rec.isNew}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
