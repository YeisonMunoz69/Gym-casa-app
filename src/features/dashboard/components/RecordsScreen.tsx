/* ============================================================
   RecordsScreen.tsx — Pantalla completa de Récords Personales
   FASE 05 — GYM-YJMG
   Responsabilidad: Mostrar todos los PRs. Se abre desde Header.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { ArrowLeft, Trophy, Zap } from 'lucide-react'
import { usePersonalRecords } from '../hooks/usePersonalRecords'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import './RecordsScreen.css'

function EmptyRecords() {
  return (
    <div className="rs-empty">
      <Trophy size={48} strokeWidth={1.5} />
      <p className="rs-empty__text">Aún no hay marcas personales</p>
      <span className="rs-empty__hint">Completa tu primera sesión para registrar récords</span>
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
    <li className="rs-row">
      <span className="rs-row__rank">{rank}</span>
      <div className="rs-row__info">
        <span className="rs-row__name text-truncate">{name}</span>
        <span className="rs-row__detail">{weightKg} kg × {reps} rep</span>
      </div>
      <div className="rs-row__right">
        <span className="rs-row__1rm">{Math.round(oneRepMaxKg)} kg</span>
        {isNew && (
          <span className="rs-row__badge" aria-label="Nuevo récord">
            <Zap size={10} />
            Nuevo
          </span>
        )}
      </div>
    </li>
  )
}

type Props = { onClose: () => void }

export function RecordsScreen({ onClose }: Props) {
  const { records, loading, error } = usePersonalRecords()

  return (
    <div className="rs-screen">
      <div className="rs-header">
        <button className="rs-header__back" onClick={onClose} aria-label="Cerrar récords">
          <ArrowLeft size={20} />
        </button>
        <h1 className="rs-header__title">Récords Personales</h1>
        {records.length > 0 && (
          <span className="rs-header__count">{records.length}</span>
        )}
      </div>

      {loading && (
        <div className="loading-fullscreen">
          <HamsterLoader size={80} />
          <span className="loading-fullscreen__label">Cargando récords...</span>
        </div>
      )}

      {!loading && error && <p className="rs-error">{error}</p>}
      {!loading && !error && records.length === 0 && <EmptyRecords />}

      {!loading && !error && records.length > 0 && (
        <ul className="rs-list">
          {records.map((rec, idx) => (
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
    </div>
  )
}
